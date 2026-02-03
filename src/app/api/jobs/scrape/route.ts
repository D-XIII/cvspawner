import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { connectToDatabase } from '@/lib/mongodb'
import ScrapedJob from '@/models/ScrapedJob'

const SCRAPER_URL = process.env.SCRAPER_URL || 'http://localhost:8000'

interface ScraperJob {
  title: string
  company: string
  location?: string
  job_url?: string
  description?: string
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  date_posted?: string
  job_type?: string
  is_remote: boolean
  site: string
}

interface ScraperResponse {
  success: boolean
  jobs: ScraperJob[]
  total: number
  message?: string
}

// POST /api/jobs/scrape - Proxy to Python scraper service
// Saves all jobs to database and returns them with IDs
// Scores are streamed separately via SSE
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    const body = await request.json()

    // Validate required fields
    if (!body.searchTerm || typeof body.searchTerm !== 'string' || body.searchTerm.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'searchTerm is required' },
        { status: 400 }
      )
    }

    // Prepare request for Python service
    const scraperRequest = {
      search_term: body.searchTerm.trim(),
      location: body.location?.trim() || undefined,
      results_wanted: body.resultsWanted || 20,
      hours_old: body.hoursOld || 72,
      country_indeed: body.countryIndeed || 'Switzerland',
      site_name: body.siteNames || undefined,
      remote_only: Boolean(body.remoteOnly),
    }

    // Call Python scraper service
    let response: Response
    try {
      response = await fetch(`${SCRAPER_URL}/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scraperRequest),
      })
    } catch (fetchError) {
      console.error('Scraper service error:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Scraper service is unavailable. Please try again later.' },
        { status: 503 }
      )
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Scraper service returned error:', errorText)
      return NextResponse.json(
        { success: false, error: `Scraper error: ${response.status}` },
        { status: response.status }
      )
    }

    const scraperData: ScraperResponse = await response.json()

    // Connect to database
    await connectToDatabase()

    // Transform and save all jobs to database
    const now = new Date()
    const jobsToSave = scraperData.jobs.map((job) => ({
      userId: user!.id,
      title: job.title,
      company: job.company,
      location: job.location,
      jobUrl: job.job_url,
      description: job.description,
      salaryMin: job.salary_min,
      salaryMax: job.salary_max,
      salaryCurrency: job.salary_currency,
      datePosted: job.date_posted,
      jobType: job.job_type,
      isRemote: job.is_remote,
      site: job.site,
      status: 'scraped' as const,
      scrapedAt: now,
      savedAt: now,
      scoreStatus: 'pending' as const,
    }))

    // Use insertMany for efficiency, but skip duplicates based on jobUrl
    // For each job, check if it already exists (same user + jobUrl)
    const savedJobs = []
    for (const jobData of jobsToSave) {
      // Try to find existing job with same URL for this user
      const existingJob = jobData.jobUrl
        ? await ScrapedJob.findOne({
            userId: user!.id,
            jobUrl: jobData.jobUrl,
          })
        : null

      if (existingJob) {
        // Job already exists, return existing one
        savedJobs.push(existingJob)
      } else {
        // Create new job
        const newJob = await ScrapedJob.create(jobData)
        savedJobs.push(newJob)
      }
    }

    // Transform to frontend format
    const jobs = savedJobs.map((job) => ({
      _id: job._id.toString(),
      title: job.title,
      company: job.company,
      location: job.location,
      jobUrl: job.jobUrl,
      description: job.description,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryCurrency: job.salaryCurrency,
      datePosted: job.datePosted,
      jobType: job.jobType,
      isRemote: job.isRemote,
      site: job.site,
      status: job.status,
      scrapedAt: job.scrapedAt,
      savedAt: job.savedAt,
      compatibilityScore: job.compatibilityScore,
      scoreStatus: job.scoreStatus,
    }))

    return NextResponse.json({
      success: true,
      jobs,
      total: scraperData.total,
      message: scraperData.message,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to scrape jobs'
    console.error('Scrape error:', error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
