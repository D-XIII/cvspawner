"""
Technical keyword detection using Stack Overflow tags and TF-IDF scoring.
Combines curated tech terms with corpus-based frequency analysis.
"""

import json
import os
import re
import threading
import time
from pathlib import Path
from typing import Optional
import requests
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np

# Cache configuration
CACHE_DIR = Path("/tmp/cvspawner_cache")
SO_TAGS_CACHE = CACHE_DIR / "stackoverflow_tags.json"
CACHE_TTL = 86400 * 7  # 7 days

# Thread safety
_lock = threading.Lock()
_tech_terms: Optional[set] = None
_tfidf_vectorizer: Optional[TfidfVectorizer] = None
_idf_scores: Optional[dict] = None

# Soft skills and generic HR terms to always exclude
SOFT_SKILLS_STOPWORDS = {
    # Soft skills
    'communication', 'leadership', 'teamwork', 'collaboration', 'motivated',
    'motivation', 'passionate', 'passion', 'enthusiastic', 'enthusiasm',
    'creative', 'creativity', 'innovative', 'innovation', 'dynamic',
    'proactive', 'autonomous', 'autonomy', 'flexible', 'flexibility',
    'adaptable', 'adaptability', 'organized', 'organization', 'rigorous',
    'curious', 'curiosity', 'dedicated', 'dedication', 'committed',
    'commitment', 'driven', 'self-starter', 'self-motivated', 'reliable',
    'responsible', 'responsibility', 'punctual', 'punctuality',
    'problem-solving', 'analytical', 'critical-thinking', 'attention',
    'detail-oriented', 'multitasking', 'time-management', 'prioritization',

    # Generic HR terms
    'experience', 'experienced', 'professional', 'professionalism',
    'qualified', 'qualification', 'qualifications', 'skills', 'skill',
    'ability', 'abilities', 'capable', 'capability', 'competent',
    'competence', 'proficient', 'proficiency', 'knowledge', 'knowledgeable',
    'expertise', 'expert', 'specialist', 'specialization', 'background',

    # Job posting filler words
    'opportunity', 'opportunities', 'position', 'role', 'job', 'career',
    'employment', 'employer', 'employee', 'candidate', 'candidates',
    'applicant', 'applicants', 'team', 'teams', 'company', 'companies',
    'organization', 'organizations', 'business', 'industry', 'sector',
    'environment', 'culture', 'workplace', 'office', 'location',
    'salary', 'compensation', 'benefits', 'package', 'competitive',
    'attractive', 'excellent', 'great', 'good', 'strong', 'solid',
    'proven', 'track-record', 'successful', 'success', 'achieve',
    'achievement', 'goal', 'goals', 'objective', 'objectives',
    'requirement', 'requirements', 'required', 'mandatory', 'must',
    'preferred', 'desired', 'desirable', 'ideal', 'ideally',
    'minimum', 'maximum', 'plus', 'bonus', 'asset',

    # Time-related
    'years', 'year', 'months', 'month', 'weeks', 'week', 'days', 'day',
    'full-time', 'part-time', 'permanent', 'temporary', 'contract',
    'freelance', 'remote', 'hybrid', 'onsite', 'on-site',

    # Actions
    'work', 'working', 'develop', 'developing', 'development',
    'manage', 'managing', 'management', 'lead', 'leading',
    'support', 'supporting', 'assist', 'assisting', 'help', 'helping',
    'create', 'creating', 'build', 'building', 'design', 'designing',
    'implement', 'implementing', 'implementation', 'maintain', 'maintaining',
    'improve', 'improving', 'improvement', 'optimize', 'optimizing',
    'deliver', 'delivering', 'ensure', 'ensuring', 'provide', 'providing',

    # Misc generic
    'looking', 'seeking', 'search', 'searching', 'join', 'joining',
    'grow', 'growing', 'growth', 'learn', 'learning', 'training',
    'mentor', 'mentoring', 'coach', 'coaching', 'guide', 'guiding',
}

# Always include these as technical (even if not in SO tags)
ALWAYS_TECH = {
    # Core languages
    'python', 'javascript', 'typescript', 'java', 'golang', 'go', 'rust',
    'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'r', 'perl',
    'bash', 'shell', 'powershell', 'lua', 'elixir', 'erlang', 'haskell',
    'clojure', 'f#', 'ocaml', 'dart', 'objective-c', 'assembly', 'cobol',
    'fortran', 'matlab', 'julia', 'groovy', 'vba', 'sql', 'plsql', 'tsql',

    # Major frameworks/libraries
    'react', 'reactjs', 'react.js', 'angular', 'angularjs', 'vue', 'vuejs',
    'vue.js', 'svelte', 'nextjs', 'next.js', 'nuxt', 'nuxtjs', 'gatsby',
    'django', 'flask', 'fastapi', 'express', 'expressjs', 'nestjs', 'nest.js',
    'spring', 'springboot', 'spring-boot', 'rails', 'ruby-on-rails', 'laravel',
    'symfony', 'asp.net', 'dotnet', '.net', 'blazor', 'wpf', 'winforms',
    'qt', 'gtk', 'electron', 'tauri', 'flutter', 'react-native', 'ionic',
    'xamarin', 'unity', 'unreal', 'godot',

    # Databases
    'postgresql', 'postgres', 'mysql', 'mariadb', 'mongodb', 'redis',
    'elasticsearch', 'opensearch', 'cassandra', 'dynamodb', 'couchdb',
    'neo4j', 'influxdb', 'timescaledb', 'clickhouse', 'snowflake',
    'bigquery', 'redshift', 'sqlite', 'oracle', 'sqlserver', 'mssql',
    'cockroachdb', 'firestore', 'supabase', 'planetscale',

    # Cloud/DevOps
    'aws', 'amazon-web-services', 'azure', 'gcp', 'google-cloud',
    'docker', 'kubernetes', 'k8s', 'openshift', 'rancher', 'nomad',
    'terraform', 'pulumi', 'cloudformation', 'ansible', 'puppet', 'chef',
    'jenkins', 'gitlab-ci', 'github-actions', 'circleci', 'travis-ci',
    'argocd', 'flux', 'spinnaker', 'tekton', 'dagger',
    'helm', 'kustomize', 'istio', 'envoy', 'linkerd', 'consul',
    'vault', 'prometheus', 'grafana', 'datadog', 'newrelic', 'splunk',
    'elk', 'elasticsearch', 'logstash', 'kibana', 'jaeger', 'zipkin',
    'nginx', 'apache', 'traefik', 'haproxy', 'caddy',
    'linux', 'unix', 'ubuntu', 'debian', 'centos', 'rhel', 'alpine',

    # Data/ML
    'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'sklearn',
    'pandas', 'numpy', 'scipy', 'matplotlib', 'seaborn', 'plotly',
    'jupyter', 'notebook', 'spark', 'pyspark', 'hadoop', 'hive', 'presto',
    'airflow', 'dagster', 'prefect', 'dbt', 'fivetran', 'airbyte',
    'mlflow', 'kubeflow', 'sagemaker', 'vertex-ai', 'huggingface',
    'langchain', 'llamaindex', 'openai', 'gpt', 'llm', 'bert', 'transformer',

    # Tools/Concepts
    'git', 'github', 'gitlab', 'bitbucket', 'svn', 'mercurial',
    'rest', 'restful', 'graphql', 'grpc', 'websocket', 'soap', 'api',
    'oauth', 'jwt', 'saml', 'openid', 'ldap', 'sso',
    'ci/cd', 'cicd', 'devops', 'devsecops', 'sre', 'gitops',
    'agile', 'scrum', 'kanban', 'jira', 'confluence', 'notion',
    'microservices', 'monolith', 'serverless', 'faas', 'lambda',
    'tdd', 'bdd', 'unit-testing', 'integration-testing', 'e2e',
    'jest', 'mocha', 'pytest', 'junit', 'rspec', 'cypress', 'playwright',
    'selenium', 'puppeteer', 'postman', 'insomnia', 'swagger', 'openapi',
}


def ensure_cache_dir():
    """Create cache directory if it doesn't exist."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)


def fetch_stackoverflow_tags(max_pages: int = 10) -> set:
    """
    Fetch popular tags from Stack Overflow API.

    Args:
        max_pages: Maximum number of pages to fetch (100 tags per page)

    Returns:
        Set of tag names
    """
    tags = set()
    base_url = "https://api.stackexchange.com/2.3/tags"

    for page in range(1, max_pages + 1):
        try:
            response = requests.get(
                base_url,
                params={
                    "site": "stackoverflow",
                    "pagesize": 100,
                    "page": page,
                    "order": "desc",
                    "sort": "popular"
                },
                timeout=10
            )

            if response.status_code == 200:
                data = response.json()
                for item in data.get("items", []):
                    tag_name = item.get("name", "").lower()
                    if tag_name:
                        tags.add(tag_name)

                # Check if there are more pages
                if not data.get("has_more", False):
                    break
            else:
                break

        except Exception as e:
            print(f"Error fetching SO tags page {page}: {e}")
            break

        # Rate limiting
        time.sleep(0.1)

    return tags


def load_tech_terms() -> set:
    """
    Load technical terms from cache or fetch from Stack Overflow.

    Returns:
        Set of technical term strings
    """
    global _tech_terms

    if _tech_terms is not None:
        return _tech_terms

    with _lock:
        if _tech_terms is not None:
            return _tech_terms

        ensure_cache_dir()

        # Check cache
        if SO_TAGS_CACHE.exists():
            try:
                cache_stat = SO_TAGS_CACHE.stat()
                cache_age = time.time() - cache_stat.st_mtime

                if cache_age < CACHE_TTL:
                    with open(SO_TAGS_CACHE, 'r') as f:
                        cached = json.load(f)
                        _tech_terms = set(cached.get("tags", []))
                        _tech_terms.update(ALWAYS_TECH)
                        print(f"Loaded {len(_tech_terms)} tech terms from cache")
                        return _tech_terms
            except Exception as e:
                print(f"Error reading cache: {e}")

        # Fetch from Stack Overflow
        print("Fetching Stack Overflow tags...")
        so_tags = fetch_stackoverflow_tags(max_pages=10)

        # Combine with always-tech terms
        _tech_terms = so_tags.union(ALWAYS_TECH)

        # Save to cache
        try:
            with open(SO_TAGS_CACHE, 'w') as f:
                json.dump({"tags": list(so_tags), "timestamp": time.time()}, f)
            print(f"Cached {len(so_tags)} SO tags, total {len(_tech_terms)} tech terms")
        except Exception as e:
            print(f"Error saving cache: {e}")

        return _tech_terms


def build_tfidf_index(job_descriptions: list[str]) -> None:
    """
    Build TF-IDF index from job descriptions corpus.
    Higher IDF = more specific/technical term.

    Args:
        job_descriptions: List of job description texts
    """
    global _tfidf_vectorizer, _idf_scores

    if not job_descriptions:
        return

    with _lock:
        # Create vectorizer with specific settings for tech terms
        _tfidf_vectorizer = TfidfVectorizer(
            lowercase=True,
            token_pattern=r'\b[a-zA-Z][a-zA-Z0-9+#._-]*[a-zA-Z0-9]\b|\b[a-zA-Z]\b',
            max_features=10000,
            min_df=1,  # Include terms appearing in at least 1 doc
            max_df=0.95,  # Exclude terms appearing in >95% of docs
        )

        _tfidf_vectorizer.fit(job_descriptions)

        # Extract IDF scores
        feature_names = _tfidf_vectorizer.get_feature_names_out()
        idf_values = _tfidf_vectorizer.idf_

        _idf_scores = {
            feature_names[i]: idf_values[i]
            for i in range(len(feature_names))
        }

        print(f"Built TF-IDF index with {len(_idf_scores)} terms")


def get_idf_score(term: str) -> float:
    """
    Get IDF score for a term. Higher = more specific.

    Args:
        term: Term to look up

    Returns:
        IDF score (0 if not found or index not built)
    """
    if _idf_scores is None:
        return 0.0

    return _idf_scores.get(term.lower(), 0.0)


def is_technical_term(term: str, idf_threshold: float = 2.0) -> bool:
    """
    Determine if a term is technical.

    A term is technical if:
    1. It's in the Stack Overflow tags OR
    2. It's in our ALWAYS_TECH list OR
    3. It has a high IDF score (specific to few jobs)

    AND it's NOT in the soft skills stopwords.

    Args:
        term: Term to check
        idf_threshold: Minimum IDF score to consider technical

    Returns:
        True if term is technical
    """
    term_lower = term.lower().strip()

    # Always exclude soft skills
    if term_lower in SOFT_SKILLS_STOPWORDS:
        return False

    # Check tech terms (SO tags + ALWAYS_TECH)
    tech_terms = load_tech_terms()
    if term_lower in tech_terms:
        return True

    # Check IDF score (if index is built)
    if _idf_scores is not None:
        idf = _idf_scores.get(term_lower, 0.0)
        if idf >= idf_threshold:
            return True

    return False


def classify_keywords(keywords: list[str], idf_threshold: float = 2.0) -> dict:
    """
    Classify a list of keywords into technical and non-technical.

    Args:
        keywords: List of keywords to classify
        idf_threshold: IDF threshold for technical classification

    Returns:
        Dict with 'technical' and 'non_technical' lists
    """
    technical = []
    non_technical = []

    for kw in keywords:
        if is_technical_term(kw, idf_threshold):
            technical.append(kw)
        else:
            non_technical.append(kw)

    return {
        "technical": technical,
        "non_technical": non_technical
    }


def get_technical_weight(term: str) -> float:
    """
    Get weight for a term based on its technicality.

    Returns:
        Weight between 0.1 (non-technical) and 2.0 (highly technical)
    """
    term_lower = term.lower().strip()

    # Soft skills get very low weight
    if term_lower in SOFT_SKILLS_STOPWORDS:
        return 0.1

    tech_terms = load_tech_terms()

    # Core tech terms from ALWAYS_TECH get highest weight
    if term_lower in ALWAYS_TECH:
        return 2.0

    # Stack Overflow tags get high weight
    if term_lower in tech_terms:
        return 1.5

    # High IDF terms get medium-high weight
    if _idf_scores is not None:
        idf = _idf_scores.get(term_lower, 0.0)
        if idf >= 3.0:
            return 1.3
        elif idf >= 2.0:
            return 1.0

    # Default low weight for unrecognized terms
    return 0.3


def extract_technical_keywords(text: str, max_keywords: int = 20) -> list[dict]:
    """
    Extract keywords from text with their technical classification.

    Args:
        text: Text to extract keywords from
        max_keywords: Maximum keywords to return

    Returns:
        List of dicts with 'keyword', 'is_technical', 'weight'
    """
    if not text:
        return []

    # Pattern for potential keywords
    patterns = [
        # Tech terms with special chars (C++, C#, .NET, Node.js)
        r'\b([A-Za-z][A-Za-z0-9]*(?:[+#._-][A-Za-z0-9]+)*)\b',
    ]

    found = set()
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            if len(match) >= 2:
                found.add(match)

    # Classify and weight
    results = []
    for kw in found:
        is_tech = is_technical_term(kw)
        weight = get_technical_weight(kw)

        # Skip very low weight terms
        if weight < 0.2:
            continue

        results.append({
            "keyword": kw,
            "is_technical": is_tech,
            "weight": weight
        })

    # Sort by weight descending, then take top N
    results.sort(key=lambda x: x["weight"], reverse=True)
    return results[:max_keywords]


# Initialize tech terms on module load (in background)
def _init_tech_terms():
    try:
        load_tech_terms()
    except Exception as e:
        print(f"Error initializing tech terms: {e}")

# Start loading in background thread
_init_thread = threading.Thread(target=_init_tech_terms, daemon=True)
_init_thread.start()
