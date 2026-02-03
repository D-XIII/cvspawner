from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from jobspy import scrape_jobs
import pandas as pd

from scoring import (
    prepare_cv_text,
    prepare_job_text,
    calculate_score,
    calculate_batch_scores,
    calculate_detailed_score,
    get_model_status,
)

app = FastAPI(title="JobSpy Scraper API", version="1.0.0")

# CORS for Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ScrapeRequest(BaseModel):
    search_term: str = Field(..., min_length=1, description="Job title or keywords to search")
    location: Optional[str] = Field(None, description="Location to search (e.g., 'Switzerland', 'Geneva')")
    results_wanted: int = Field(default=20, ge=1, le=100, description="Number of results to return")
    hours_old: Optional[int] = Field(default=72, ge=1, description="Only jobs posted within this many hours")
    country_indeed: str = Field(default="Switzerland", description="Country for Indeed search")
    site_name: Optional[List[str]] = Field(
        default=None,
        description="Sites to scrape: indeed, linkedin, zip_recruiter, glassdoor, google"
    )
    remote_only: bool = Field(default=False, description="Only remote jobs")


class Job(BaseModel):
    title: str
    company: str
    location: Optional[str] = None
    job_url: Optional[str] = None
    description: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: Optional[str] = None
    date_posted: Optional[str] = None
    job_type: Optional[str] = None
    is_remote: bool = False
    site: str


class ScrapeResponse(BaseModel):
    success: bool
    jobs: List[Job]
    total: int
    message: Optional[str] = None


# Scoring models
class CVProfile(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None


class CVExperience(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    description: Optional[str] = None


class CVSkill(BaseModel):
    name: str
    category: Optional[str] = None


class CVData(BaseModel):
    profile: Optional[CVProfile] = None
    experiences: List[CVExperience] = []
    skills: List[CVSkill] = []


class JobForScoring(BaseModel):
    id: Optional[str] = None
    title: str
    company: str
    description: Optional[str] = None


class ScoreRequest(BaseModel):
    cv_data: CVData
    job: JobForScoring


class ScoreResponse(BaseModel):
    score: float
    message: Optional[str] = None


class BatchScoreRequest(BaseModel):
    cv_data: CVData
    jobs: List[JobForScoring]


class BatchScoreResult(BaseModel):
    id: str
    score: float


class BatchScoreResponse(BaseModel):
    results: List[BatchScoreResult]
    message: Optional[str] = None


# Detailed scoring models
class ExperienceMatch(BaseModel):
    title: str
    company: str
    score: float
    relevant: bool


class DetailedScoreResponse(BaseModel):
    globalScore: float
    experienceMatches: List[ExperienceMatch]
    matchedKeywords: List[str]
    missingKeywords: List[str]
    matchedSkills: List[str]
    totalKeywords: int
    message: Optional[str] = None


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "jobspy-scraper"}


@app.post("/scrape", response_model=ScrapeResponse)
async def scrape_jobs_endpoint(request: ScrapeRequest):
    """
    Scrape jobs from multiple job boards using JobSpy.

    Supported sites: indeed, linkedin, zip_recruiter, glassdoor, google
    """
    try:
        # Default to all supported sites if none specified
        sites = request.site_name or ["indeed", "linkedin", "glassdoor", "zip_recruiter", "google"]

        # Call JobSpy
        jobs_df = scrape_jobs(
            site_name=sites,
            search_term=request.search_term,
            location=request.location,
            results_wanted=request.results_wanted,
            hours_old=request.hours_old,
            country_indeed=request.country_indeed,
            is_remote=request.remote_only,
        )

        if jobs_df is None or jobs_df.empty:
            return ScrapeResponse(
                success=True,
                jobs=[],
                total=0,
                message="No jobs found matching your criteria"
            )

        # Convert DataFrame to list of Job objects
        jobs = []
        for _, row in jobs_df.iterrows():
            job = Job(
                title=str(row.get("title", "")) or "Unknown",
                company=str(row.get("company", "")) or "Unknown",
                location=str(row.get("location", "")) if pd.notna(row.get("location")) else None,
                job_url=str(row.get("job_url", "")) if pd.notna(row.get("job_url")) else None,
                description=str(row.get("description", ""))[:2000] if pd.notna(row.get("description")) else None,
                salary_min=float(row.get("min_amount")) if pd.notna(row.get("min_amount")) else None,
                salary_max=float(row.get("max_amount")) if pd.notna(row.get("max_amount")) else None,
                salary_currency=str(row.get("currency")) if pd.notna(row.get("currency")) else None,
                date_posted=str(row.get("date_posted")) if pd.notna(row.get("date_posted")) else None,
                job_type=str(row.get("job_type")) if pd.notna(row.get("job_type")) else None,
                is_remote=bool(row.get("is_remote", False)),
                site=str(row.get("site", "unknown")),
            )
            jobs.append(job)

        return ScrapeResponse(
            success=True,
            jobs=jobs,
            total=len(jobs),
            message=f"Successfully scraped {len(jobs)} jobs"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Scraping failed: {str(e)}"
        )


@app.get("/model-status")
async def model_status():
    """Check if the ML model is loaded."""
    status = get_model_status()
    return status


@app.post("/score", response_model=ScoreResponse)
async def score_job(request: ScoreRequest):
    """
    Calculate compatibility score between a CV and a job.

    Returns a score from 0 to 100 indicating how well the CV matches the job.
    """
    try:
        # Convert Pydantic models to dicts for scoring functions
        cv_dict = {
            "profile": request.cv_data.profile.model_dump() if request.cv_data.profile else None,
            "experiences": [e.model_dump() for e in request.cv_data.experiences],
            "skills": [s.model_dump() for s in request.cv_data.skills]
        }

        cv_text = prepare_cv_text(cv_dict)

        if not cv_text:
            return ScoreResponse(
                score=0,
                message="CV is empty. Please add profile, experiences, or skills."
            )

        job_dict = request.job.model_dump()
        job_text = prepare_job_text(job_dict)

        score = calculate_score(cv_text, job_text)

        return ScoreResponse(score=score)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Score calculation failed: {str(e)}"
        )


@app.post("/score-batch", response_model=BatchScoreResponse)
async def score_jobs_batch(request: BatchScoreRequest):
    """
    Calculate compatibility scores for multiple jobs at once.

    More efficient than calling /score multiple times.
    """
    try:
        # Convert CV data
        cv_dict = {
            "profile": request.cv_data.profile.model_dump() if request.cv_data.profile else None,
            "experiences": [e.model_dump() for e in request.cv_data.experiences],
            "skills": [s.model_dump() for s in request.cv_data.skills]
        }

        cv_text = prepare_cv_text(cv_dict)

        if not cv_text:
            # Return 0 for all jobs if CV is empty
            results = [
                BatchScoreResult(id=job.id or str(i), score=0)
                for i, job in enumerate(request.jobs)
            ]
            return BatchScoreResponse(
                results=results,
                message="CV is empty. All scores set to 0."
            )

        # Prepare jobs for batch scoring
        jobs_for_scoring = []
        for i, job in enumerate(request.jobs):
            job_text = prepare_job_text(job.model_dump())
            jobs_for_scoring.append({
                "id": job.id or str(i),
                "text": job_text
            })

        # Calculate batch scores
        score_results = calculate_batch_scores(cv_text, jobs_for_scoring)

        results = [
            BatchScoreResult(id=r["id"], score=r["score"])
            for r in score_results
        ]

        return BatchScoreResponse(results=results)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Batch scoring failed: {str(e)}"
        )


@app.post("/score-detailed", response_model=DetailedScoreResponse)
async def score_job_detailed(request: ScoreRequest):
    """
    Calculate detailed compatibility score with explanations.

    Returns global score plus breakdown of:
    - Which experiences match the job
    - Which keywords from the job are in the CV
    - Which keywords are missing
    """
    try:
        # Convert Pydantic models to dicts
        cv_dict = {
            "profile": request.cv_data.profile.model_dump() if request.cv_data.profile else None,
            "experiences": [e.model_dump() for e in request.cv_data.experiences],
            "skills": [s.model_dump() for s in request.cv_data.skills]
        }

        job_dict = request.job.model_dump()

        # Calculate detailed score
        result = calculate_detailed_score(cv_dict, job_dict, threshold=50.0)

        return DetailedScoreResponse(
            globalScore=result["globalScore"],
            experienceMatches=[
                ExperienceMatch(**exp) for exp in result["experienceMatches"]
            ],
            matchedKeywords=result["matchedKeywords"],
            missingKeywords=result["missingKeywords"],
            matchedSkills=result["matchedSkills"],
            totalKeywords=result["totalKeywords"]
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Detailed scoring failed: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
