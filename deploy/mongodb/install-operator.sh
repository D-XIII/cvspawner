#!/bin/bash
# Script d'installation de Percona Operator pour MongoDB
# Documentation: https://docs.percona.com/percona-operator-for-mongodb/

set -e

echo "=== Installation de Percona Operator pour MongoDB ==="

# Vérifier kubectl
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl n'est pas installé"
    exit 1
fi

# Vérifier la connexion au cluster
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Impossible de se connecter au cluster Kubernetes"
    exit 1
fi

echo "✅ Connexion au cluster OK"

# Créer le namespace pour l'opérateur
echo "📦 Création du namespace psmdb-operator..."
kubectl create namespace psmdb-operator --dry-run=client -o yaml | kubectl apply -f -

# Installer les CRDs
echo "📦 Installation des CRDs Percona..."
kubectl apply --server-side -f https://raw.githubusercontent.com/percona/percona-server-mongodb-operator/v1.16.0/deploy/crd.yaml

# Installer l'opérateur
echo "📦 Installation de l'opérateur..."
kubectl apply -f https://raw.githubusercontent.com/percona/percona-server-mongodb-operator/v1.16.0/deploy/rbac.yaml -n psmdb-operator
kubectl apply -f https://raw.githubusercontent.com/percona/percona-server-mongodb-operator/v1.16.0/deploy/operator.yaml -n psmdb-operator

# Attendre que l'opérateur soit prêt
echo "⏳ Attente du démarrage de l'opérateur..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=percona-server-mongodb-operator -n psmdb-operator --timeout=120s

echo ""
echo "✅ Percona Operator installé avec succès!"
echo ""
echo "Prochaines étapes:"
echo "1. Créer le namespace cvspawner: kubectl create namespace cvspawner"
echo "2. Modifier les secrets dans deploy/mongodb/psmdb-cluster.yaml"
echo "3. Appliquer le cluster: kubectl apply -f deploy/mongodb/psmdb-cluster.yaml"
echo ""
echo "Pour vérifier le status:"
echo "  kubectl get psmdb -n cvspawner"
echo "  kubectl get pods -n cvspawner -l app.kubernetes.io/instance=cvspawner-mongodb"
