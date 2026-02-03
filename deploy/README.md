# CVSpawner - Déploiement Kubernetes GitOps

Ce dossier contient tous les manifests Kubernetes pour déployer CVSpawner avec ArgoCD.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Cluster Kubernetes                       │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  cvspawner  │◄───│   scraper   │    │   MongoDB   │     │
│  │   (Next.js) │    │   (Python)  │    │  (Percona)  │     │
│  │   :3000     │    │    :8000    │    │   :27017    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                                     ▲             │
│         ▼                                     │             │
│  ┌─────────────┐                    Connection URI          │
│  │   Ingress   │                              │             │
│  │  (nginx)    │                    ┌─────────────────┐     │
│  └─────────────┘                    │ cvspawner-secrets│    │
│         │                           └─────────────────┘     │
└─────────│───────────────────────────────────────────────────┘
          ▼
    Internet (HTTPS)
```

## Prérequis

- Cluster Kubernetes (1.25+)
- ArgoCD installé sur le cluster
- kubectl configuré
- Accès aux images ghcr.io (repo public)

## Structure des fichiers

```
deploy/
├── base/                          # Manifests de base
│   ├── kustomization.yaml
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secret.yaml                # ⚠️ Template - ne pas commiter les vraies valeurs
│   ├── deployment-app.yaml
│   ├── deployment-scraper.yaml
│   ├── service-app.yaml
│   ├── service-scraper.yaml
│   └── ingress.yaml
├── overlays/
│   └── production/                # Configuration production
│       ├── kustomization.yaml
│       └── patches/
│           ├── replicas.yaml
│           └── resources.yaml
├── mongodb/                       # Percona MongoDB Operator
│   ├── kustomization.yaml
│   ├── psmdb-cluster.yaml
│   └── install-operator.sh
├── argocd-application.yaml        # Application ArgoCD
└── README.md
```

## Installation

### 1. Préparer le repo de déploiement

```bash
# Créer un nouveau repo GitHub pour les manifests
# Puis copier le contenu de ce dossier

# Option 1: Copier vers un nouveau repo
mkdir cvspawner-deploy
cp -r deploy/* cvspawner-deploy/
cd cvspawner-deploy
git init
git add .
git commit -m "Initial Kubernetes manifests"
git remote add origin https://github.com/VOTRE_USER/cvspawner-deploy.git
git push -u origin main
```

### 2. Configurer les images

Dans `base/kustomization.yaml` et `overlays/production/kustomization.yaml`, remplacez:
- `D-XIII` par votre username/organisation GitHub

### 3. Configurer les secrets

**Option A: Secrets Kubernetes directs (dev/test uniquement)**
```bash
# Éditer base/secret.yaml avec vos vraies valeurs
# ⚠️ Ne jamais commiter ce fichier avec des vraies valeurs!
```

**Option B: Sealed Secrets (recommandé pour production)**
```bash
# Installer Sealed Secrets
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Créer un secret scellé
kubeseal --format yaml < base/secret.yaml > sealed-secret.yaml
```

**Option C: External Secrets Operator**
```bash
# Voir: https://external-secrets.io/
```

### 4. Installer Percona MongoDB Operator

```bash
# Exécuter le script d'installation
./mongodb/install-operator.sh

# Puis éditer mongodb/psmdb-cluster.yaml avec vos mots de passe
# Et appliquer:
kubectl apply -f mongodb/psmdb-cluster.yaml
```

### 5. Configurer l'Ingress

Éditez `base/ingress.yaml`:
- Remplacez `cvspawner.example.com` par votre domaine
- Adaptez `ingressClassName` selon votre Ingress Controller (nginx, traefik, etc.)
- Décommentez la section TLS si vous utilisez cert-manager

### 6. Déployer avec ArgoCD

```bash
# Éditer argocd-application.yaml avec l'URL de votre repo
# Puis appliquer:
kubectl apply -f argocd-application.yaml
```

Ou via l'UI ArgoCD:
1. Aller sur ArgoCD UI
2. New App → YAML
3. Coller le contenu de `argocd-application.yaml`

## Mise à jour des images

### Automatique (recommandé)

Le workflow GitHub Actions dans le repo principal:
1. Build les images sur push/tag
2. Push vers ghcr.io avec tags `sha-xxxxx`

Pour déclencher un déploiement, mettez à jour le tag dans `overlays/production/kustomization.yaml`:
```yaml
images:
  - name: ghcr.io/D-XIII/cvspawner
    newTag: sha-abc1234  # Nouveau tag
```

### Avec ArgoCD Image Updater (optionnel)

```yaml
# Ajouter cette annotation à l'Application ArgoCD
metadata:
  annotations:
    argocd-image-updater.argoproj.io/image-list: app=ghcr.io/D-XIII/cvspawner:sha-*
    argocd-image-updater.argoproj.io/app.update-strategy: latest
```

## Variables d'environnement

### ConfigMap (non-sensibles)
| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| NODE_ENV | Environnement Node.js | production |
| NEXT_TELEMETRY_DISABLED | Désactiver télémétrie Next.js | 1 |
| SCRAPER_URL | URL interne du scraper | http://cvspawner-scraper:8000 |

### Secrets (sensibles)
| Variable | Description |
|----------|-------------|
| MONGODB_URI | URI de connexion MongoDB |
| NEXTAUTH_SECRET | Secret pour NextAuth (générer avec `openssl rand -base64 32`) |
| NEXTAUTH_URL | URL publique de l'application |

## Commandes utiles

```bash
# Voir les pods
kubectl get pods -n cvspawner

# Logs de l'application
kubectl logs -f -l app.kubernetes.io/component=app -n cvspawner

# Logs du scraper
kubectl logs -f -l app.kubernetes.io/component=scraper -n cvspawner

# Status MongoDB
kubectl get psmdb -n cvspawner

# Redémarrer l'application
kubectl rollout restart deployment/cvspawner-app -n cvspawner

# Tester la connexion MongoDB depuis un pod
kubectl run mongo-test --rm -it --image=mongo:7 --restart=Never -n cvspawner -- \
  mongosh "mongodb://cvspawner-mongodb-rs0-0.cvspawner-mongodb-rs0.cvspawner.svc.cluster.local:27017"

# Voir les événements ArgoCD
kubectl get applications -n argocd
argocd app get cvspawner
```

## Troubleshooting

### L'application ne démarre pas
```bash
# Vérifier les événements
kubectl describe pod -l app.kubernetes.io/component=app -n cvspawner

# Vérifier les secrets
kubectl get secret cvspawner-secrets -n cvspawner -o yaml
```

### MongoDB ne se connecte pas
```bash
# Vérifier que Percona est prêt
kubectl get psmdb -n cvspawner

# Vérifier les pods MongoDB
kubectl get pods -l app.kubernetes.io/instance=cvspawner-mongodb -n cvspawner
```

### ArgoCD OutOfSync
```bash
# Forcer la synchronisation
argocd app sync cvspawner

# Voir les différences
argocd app diff cvspawner
```

## Resources

- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [Kustomize Documentation](https://kustomize.io/)
- [Percona Operator Documentation](https://docs.percona.com/percona-operator-for-mongodb/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment)
