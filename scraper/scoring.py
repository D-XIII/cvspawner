"""
Scoring service for CV-Job compatibility using Sentence Transformers.
Uses the paraphrase-multilingual-MiniLM-L12-v2 model for multilingual support.
"""

from typing import Optional
from sentence_transformers import SentenceTransformer
from sentence_transformers.util import cos_sim
import threading

# Model configuration
MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"

# Lazy loading with thread safety
_model: Optional[SentenceTransformer] = None
_model_lock = threading.Lock()


def get_model() -> SentenceTransformer:
    """
    Get the sentence transformer model (lazy loaded).
    Thread-safe singleton pattern.
    """
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                _model = SentenceTransformer(MODEL_NAME)
    return _model


def get_model_status() -> dict:
    """
    Return the current model status.

    Returns:
        dict with 'loaded' (bool) and 'model_name' (str)
    """
    return {
        "loaded": _model is not None,
        "model_name": MODEL_NAME
    }


def prepare_cv_text(cv_data: dict) -> str:
    """
    Prepare CV data into a single text string for embedding.

    Args:
        cv_data: Dictionary containing profile, experiences, and skills

    Returns:
        Combined text representation of the CV
    """
    parts = []

    # Profile section
    profile = cv_data.get("profile")
    if profile:
        if profile.get("title"):
            parts.append(f"Title: {profile['title']}")
        if profile.get("summary"):
            parts.append(f"Summary: {profile['summary']}")

    # Experiences section
    experiences = cv_data.get("experiences", [])
    for exp in experiences:
        exp_parts = []
        if exp.get("title"):
            exp_parts.append(exp["title"])
        if exp.get("company"):
            exp_parts.append(f"at {exp['company']}")
        if exp.get("description"):
            exp_parts.append(f"- {exp['description']}")
        if exp_parts:
            parts.append(" ".join(exp_parts))

    # Skills section
    skills = cv_data.get("skills", [])
    skill_names = [s.get("name") for s in skills if s.get("name")]
    if skill_names:
        parts.append(f"Skills: {', '.join(skill_names)}")

    return " ".join(parts)


def prepare_job_text(job: dict) -> str:
    """
    Prepare job data into a single text string for embedding.

    Args:
        job: Dictionary containing job title, company, description

    Returns:
        Combined text representation of the job
    """
    parts = []

    if job.get("title"):
        parts.append(f"Position: {job['title']}")

    if job.get("company"):
        parts.append(f"Company: {job['company']}")

    if job.get("description"):
        parts.append(f"Description: {job['description']}")

    return " ".join(parts)


def calculate_score(cv_text: str, job_text: str) -> float:
    """
    Calculate compatibility score between CV and job.

    Args:
        cv_text: Prepared CV text
        job_text: Prepared job text

    Returns:
        Score between 0 and 100
    """
    if not cv_text or not cv_text.strip():
        return 0.0

    if not job_text or not job_text.strip():
        return 0.0

    model = get_model()

    # Encode both texts
    embeddings = model.encode([cv_text, job_text], convert_to_tensor=True)

    # Calculate cosine similarity
    similarity = cos_sim(embeddings[0], embeddings[1]).item()

    # Convert to 0-100 scale
    # Cosine similarity ranges from -1 to 1, but for text it's usually 0 to 1
    # We map 0-1 to 0-100
    score = max(0, min(100, similarity * 100))

    return round(score, 1)


def calculate_batch_scores(cv_text: str, jobs: list[dict]) -> list[dict]:
    """
    Calculate scores for multiple jobs at once (more efficient).

    Args:
        cv_text: Prepared CV text
        jobs: List of jobs with 'id' and 'text' fields

    Returns:
        List of dicts with 'id' and 'score' fields
    """
    if not cv_text or not cv_text.strip():
        return [{"id": job["id"], "score": 0.0} for job in jobs]

    if not jobs:
        return []

    model = get_model()

    # Prepare all texts
    job_texts = [job.get("text", "") for job in jobs]
    all_texts = [cv_text] + job_texts

    # Encode all at once
    embeddings = model.encode(all_texts, convert_to_tensor=True)

    cv_embedding = embeddings[0]
    job_embeddings = embeddings[1:]

    # Calculate similarities
    results = []
    for i, job in enumerate(jobs):
        if job_texts[i]:
            similarity = cos_sim(cv_embedding, job_embeddings[i]).item()
            score = max(0, min(100, similarity * 100))
        else:
            score = 0.0

        results.append({
            "id": job["id"],
            "score": round(score, 1)
        })

    return results


import re


def extract_keywords(text: str, max_keywords: int = 20) -> list[str]:
    """
    Extract technical keywords and proper nouns from text.

    Args:
        text: Text to extract keywords from
        max_keywords: Maximum number of keywords to return

    Returns:
        List of unique keywords
    """
    if not text:
        return []

    # Common tech keywords pattern (languages, frameworks, tools)
    tech_patterns = [
        # Programming languages
        r'\b(Python|JavaScript|TypeScript|Java|C\+\+|C#|Go|Rust|Ruby|PHP|Swift|Kotlin|Scala|R)\b',
        # Frameworks & Libraries
        r'\b(React|Angular|Vue|Next\.?js|Node\.?js|Django|Flask|FastAPI|Spring|Rails|Laravel|Express)\b',
        # Databases
        r'\b(MongoDB|PostgreSQL|MySQL|Redis|Elasticsearch|SQLite|Oracle|Cassandra|DynamoDB)\b',
        # Cloud & DevOps
        r'\b(AWS|Azure|GCP|Docker|Kubernetes|K8s|Terraform|Jenkins|GitLab|GitHub|CI/CD)\b',
        # Tools & Concepts
        r'\b(Git|REST|GraphQL|API|Agile|Scrum|TDD|DevOps|Microservices|Linux|Unix)\b',
        # Data & ML
        r'\b(Machine Learning|ML|AI|Deep Learning|TensorFlow|PyTorch|Pandas|NumPy|SQL|NoSQL)\b',
    ]

    keywords = set()
    text_lower = text.lower()

    # Extract tech keywords (case-insensitive matching, preserve original case)
    for pattern in tech_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            keywords.add(match)

    # Extract capitalized words (potential proper nouns, tools, acronyms)
    # Match words with 2+ uppercase letters or starting with uppercase
    capitalized = re.findall(r'\b([A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)?)\b', text)
    for word in capitalized:
        # Filter out common words and short words
        if len(word) > 2 and word.lower() not in {'the', 'and', 'for', 'with', 'are', 'you', 'our', 'will', 'can', 'has', 'have', 'this', 'that', 'from', 'they', 'been', 'would', 'could', 'should', 'about', 'into', 'your', 'their', 'what', 'when', 'where', 'which', 'who', 'how', 'all', 'each', 'other', 'some', 'such', 'than', 'then', 'these', 'those', 'very', 'just', 'over', 'also', 'after', 'before', 'more', 'most', 'only', 'same', 'any', 'both', 'few', 'own', 'well', 'back', 'being', 'experience', 'working', 'work', 'team', 'company', 'position', 'role', 'job', 'years', 'year', 'ability', 'skills', 'strong', 'good', 'great', 'excellent'}:
            keywords.add(word)

    # Extract years of experience patterns
    years_exp = re.findall(r'(\d+\+?\s*(?:years?|ans?)\s*(?:of\s+)?(?:experience|expérience)?)', text, re.IGNORECASE)
    for exp in years_exp:
        keywords.add(exp.strip())

    # Limit and return
    return list(keywords)[:max_keywords]


def calculate_experience_scores(experiences: list[dict], job_text: str, threshold: float = 50.0) -> list[dict]:
    """
    Calculate how well each experience matches the job.

    Args:
        experiences: List of experience dicts with title, company, description
        job_text: Prepared job text
        threshold: Minimum score to be considered relevant

    Returns:
        List of experiences with their scores, sorted by score descending
    """
    if not experiences or not job_text:
        return []

    model = get_model()

    # Prepare experience texts
    exp_texts = []
    for exp in experiences:
        parts = []
        if exp.get("title"):
            parts.append(exp["title"])
        if exp.get("company"):
            parts.append(f"at {exp['company']}")
        if exp.get("description"):
            parts.append(exp["description"])
        exp_texts.append(" ".join(parts) if parts else "")

    # Filter out empty experiences
    valid_indices = [i for i, t in enumerate(exp_texts) if t.strip()]
    if not valid_indices:
        return []

    valid_texts = [exp_texts[i] for i in valid_indices]

    # Encode all at once
    all_texts = [job_text] + valid_texts
    embeddings = model.encode(all_texts, convert_to_tensor=True)

    job_embedding = embeddings[0]
    exp_embeddings = embeddings[1:]

    # Calculate scores
    results = []
    for i, idx in enumerate(valid_indices):
        similarity = cos_sim(job_embedding, exp_embeddings[i]).item()
        score = max(0, min(100, similarity * 100))
        score = round(score, 1)

        exp = experiences[idx]
        results.append({
            "title": exp.get("title", "Unknown"),
            "company": exp.get("company", ""),
            "score": score,
            "relevant": score >= threshold
        })

    # Sort by score descending
    results.sort(key=lambda x: x["score"], reverse=True)
    return results


def find_matching_keywords(cv_data: dict, job_keywords: list[str]) -> tuple[list[str], list[str]]:
    """
    Find which job keywords are present in the CV and which are missing.

    Args:
        cv_data: CV data dict with profile, experiences, skills
        job_keywords: List of keywords extracted from the job

    Returns:
        Tuple of (matched_keywords, missing_keywords)
    """
    if not job_keywords:
        return [], []

    # Build CV text for searching - include all relevant fields
    cv_parts = []

    profile = cv_data.get("profile")
    if profile:
        if profile.get("title"):
            cv_parts.append(profile["title"])
        if profile.get("summary"):
            cv_parts.append(profile["summary"])

    for exp in cv_data.get("experiences", []):
        if exp.get("title"):
            cv_parts.append(exp["title"])
        if exp.get("company"):
            cv_parts.append(exp["company"])
        if exp.get("description"):
            cv_parts.append(exp["description"])

    for skill in cv_data.get("skills", []):
        if skill.get("name"):
            cv_parts.append(skill["name"])
        if skill.get("category"):
            cv_parts.append(skill["category"])

    cv_text_lower = " ".join(cv_parts).lower()

    # Also build a set of individual words for partial matching
    cv_words = set()
    for part in cv_parts:
        cv_words.update(part.lower().split())

    matched = []
    missing = []

    for keyword in job_keywords:
        keyword_lower = keyword.lower()
        keyword_words = keyword_lower.split()

        # Check for:
        # 1. Exact substring match in full text
        # 2. Any word from multi-word keyword present in CV
        # 3. Partial match (keyword contained in a CV word or vice versa)
        is_matched = False

        if keyword_lower in cv_text_lower:
            is_matched = True
        elif any(kw in cv_text_lower for kw in keyword_words):
            is_matched = True
        elif any(keyword_lower in word or word in keyword_lower for word in cv_words if len(word) > 2):
            is_matched = True

        if is_matched:
            matched.append(keyword)
        else:
            missing.append(keyword)

    return matched, missing


def calculate_detailed_score(cv_data: dict, job: dict, threshold: float = 50.0) -> dict:
    """
    Calculate detailed compatibility score with explanations.

    Args:
        cv_data: CV data dict with profile, experiences, skills
        job: Job dict with title, company, description
        threshold: Minimum score for experience to be relevant

    Returns:
        Detailed score result with global score, experience matches, and keywords
    """
    cv_text = prepare_cv_text(cv_data)
    job_text = prepare_job_text(job)

    # Calculate global score
    global_score = calculate_score(cv_text, job_text)

    # Calculate experience scores
    experiences = cv_data.get("experiences", [])
    experience_matches = calculate_experience_scores(experiences, job_text, threshold)

    # Extract job keywords
    job_description = job.get("description", "")
    job_title = job.get("title", "")
    job_full_text = f"{job_title} {job_description}"
    job_keywords = extract_keywords(job_full_text)

    # Find matched and missing keywords
    matched_keywords, missing_keywords = find_matching_keywords(cv_data, job_keywords)

    # Get user's skills that match any job keyword
    user_skills = [s.get("name") for s in cv_data.get("skills", []) if s.get("name")]
    matched_skills = []
    for skill in user_skills:
        skill_lower = skill.lower()
        skill_words = skill_lower.split()
        for kw in job_keywords:
            kw_lower = kw.lower()
            # Match if skill contains keyword, keyword contains skill, or any word matches
            if (skill_lower in kw_lower or
                kw_lower in skill_lower or
                any(sw in kw_lower for sw in skill_words) or
                any(kw_lower in sw for sw in skill_words)):
                if skill not in matched_skills:
                    matched_skills.append(skill)
                break

    return {
        "globalScore": global_score,
        "experienceMatches": experience_matches,
        "matchedKeywords": matched_keywords,
        "missingKeywords": missing_keywords,
        "matchedSkills": matched_skills,
        "totalKeywords": len(job_keywords)
    }
