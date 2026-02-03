import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth-utils'
import Profile from '@/models/Profile'
import Experience from '@/models/Experience'
import Skill from '@/models/Skill'

const SCRAPER_URL = process.env.SCRAPER_URL || 'http://localhost:8000'

interface CVDataForScoring {
  profile: { title?: string; summary?: string } | null
  experiences: Array<{ title?: string; company?: string; description?: string }>
  skills: Array<{ name: string; category?: string }>
}

async function getUserCVData(userId: string): Promise<CVDataForScoring> {
  const [profile, experiences, skills] = await Promise.all([
    Profile.findOne({ userId }).lean(),
    Experience.find({ userId }).lean(),
    Skill.find({ userId }).lean(),
  ])

  return {
    profile: profile ? { title: profile.title, summary: profile.summary } : null,
    experiences: experiences.map((exp) => ({
      title: exp.title,
      company: exp.company,
      description: exp.description,
    })),
    skills: skills.map((skill) => ({
      name: skill.name,
      category: skill.category,
    })),
  }
}

function isCVEmpty(cvData: CVDataForScoring): boolean {
  const hasProfile = cvData.profile && (cvData.profile.title || cvData.profile.summary)
  const hasExperiences = cvData.experiences.length > 0
  const hasSkills = cvData.skills.length > 0
  return !hasProfile && !hasExperiences && !hasSkills
}

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

    // Transform response to match our frontend format
    let jobs: Array<{
      title: string
      company: string
      location: string | undefined
      jobUrl: string | undefined
      description: string | undefined
      salaryMin: number | undefined
      salaryMax: number | undefined
      salaryCurrency: string | undefined
      datePosted: string | undefined
      jobType: string | undefined
      isRemote: boolean
      site: string
      compatibilityScore: number | undefined
      scoreStatus: 'pending' | 'completed' | 'error'
    }> = scraperData.jobs.map((job) => ({
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
      // Score fields (will be populated below)
      compatibilityScore: undefined,
      scoreStatus: 'pending' as const,
    }))

    // Get user's CV and calculate scores
    await connectToDatabase()
    const cvData = await getUserCVData(user!.id)

    if (!isCVEmpty(cvData) && jobs.length > 0) {
      try {
        // Prepare jobs for scoring
        const jobsForScoring = jobs.map((job, index) => ({
          id: String(index),
          title: job.title,
          company: job.company,
          description: job.description,
        }))

        // Call scoring service
        const scoreResponse = await fetch(`${SCRAPER_URL}/score-batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cv_data: cvData,
            jobs: jobsForScoring,
          }),
        })

        if (scoreResponse.ok) {
          const scoreData = await scoreResponse.json()
          // Attach scores to jobs
          jobs = jobs.map((job, index) => {
            const scoreResult = scoreData.results.find(
              (r: { id: string; score: number }) => r.id === String(index)
            )
            return {
              ...job,
              compatibilityScore: scoreResult?.score,
              scoreStatus: scoreResult ? 'completed' as const : 'error' as const,
            }
          })
        }
      } catch (scoreError) {
        console.error('Scoring error:', scoreError)
        // Continue without scores if scoring fails
      }
    }

    return NextResponse.json({
      success: true,
      jobs,
      total: scraperData.total,
      message: scraperData.message,
      cvEmpty: isCVEmpty(cvData),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to scrape jobs'
    console.error('Scrape error:', error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
