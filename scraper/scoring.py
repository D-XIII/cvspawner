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
