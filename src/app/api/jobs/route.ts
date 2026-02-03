import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth-utils'
import ScrapedJob from '@/models/ScrapedJob'

// GET /api/jobs - Get all saved jobs for the user
export async function GET() {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    await connectToDatabase()

    const jobs = await ScrapedJob.find({ userId: user!.id })
      .sort({ savedAt: -1 })
      .lean()

    return NextResponse.json({ success: true, data: jobs })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch jobs'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// POST /api/jobs - Save a new job
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    await connectToDatabase()

    const body = await request.json()

    // Validate required fields
    if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'title is required' },
        { status: 400 }
      )
    }

    if (!body.company || typeof body.company !== 'string' || body.company.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'company is required' },
        { status: 400 }
      )
    }

    if (!body.site || typeof body.site !== 'string' || body.site.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'site is required' },
        { status: 400 }
      )
    }

    // If score was already calculated during scraping, use it
    const hasScore = typeof body.compatibilityScore === 'number'

    const jobData = {
      userId: user!.id,
      title: body.title.trim(),
      company: body.company.trim(),
      location: body.location?.trim() || undefined,
      jobUrl: body.jobUrl?.trim() || undefined,
      description: body.description?.trim() || undefined,
      salaryMin: body.salaryMin || undefined,
      salaryMax: body.salaryMax || undefined,
      salaryCurrency: body.salaryCurrency?.trim() || undefined,
      datePosted: body.datePosted || undefined,
      jobType: body.jobType?.trim() || undefined,
      isRemote: Boolean(body.isRemote),
      site: body.site.trim(),
      savedAt: new Date(),
      // Use existing score if provided, otherwise mark as pending
      compatibilityScore: hasScore ? body.compatibilityScore : undefined,
      scoreStatus: hasScore ? 'completed' : 'pending',
      scoreCalculatedAt: hasScore ? new Date() : undefined,
    }

    const job = await ScrapedJob.create(jobData)

    return NextResponse.json({ success: true, data: job }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save job'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
