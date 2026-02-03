import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'

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
// Returns jobs immediately without scoring (scores streamed via SSE)
export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAuth()
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

    // Transform response to match our frontend format
    // Scores will be streamed separately via SSE
    const jobs = scraperData.jobs.map((job) => ({
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
      // Score fields (will be populated via SSE)
      compatibilityScore: undefined,
      scoreStatus: 'pending' as const,
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
