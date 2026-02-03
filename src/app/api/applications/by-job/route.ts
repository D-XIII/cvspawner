import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth-utils'
import Application from '@/models/Application'

// GET /api/applications/by-job?jobIds=id1,id2,id3
// Returns a map of jobId -> application for the current user
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    await connectToDatabase()

    const searchParams = request.nextUrl.searchParams
    const jobIdsParam = searchParams.get('jobIds')

    if (!jobIdsParam) {
      return NextResponse.json(
        { success: false, error: 'jobIds parameter is required' },
        { status: 400 }
      )
    }

    const jobIds = jobIdsParam.split(',').filter(Boolean)

    if (jobIds.length === 0) {
      return NextResponse.json({ success: true, data: {} })
    }

    const applications = await Application.find({
      userId: user!.id,
      jobId: { $in: jobIds },
    }).lean()

    // Create a map of jobId -> application
    const applicationsByJob: Record<string, typeof applications[0]> = {}
    for (const app of applications) {
      if (app.jobId) {
        applicationsByJob[app.jobId.toString()] = app
      }
    }

    return NextResponse.json({ success: true, data: applicationsByJob })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch applications'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
