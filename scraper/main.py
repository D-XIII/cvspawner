from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from jobspy import scrape_jobs
import pandas as pd

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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
