import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth-utils'
import ScrapedJob from '@/models/ScrapedJob'

type Params = { params: Promise<{ id: string }> }

// GET /api/jobs/[id] - Get a specific job
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    const { id } = await params

    await connectToDatabase()

    const job = await ScrapedJob.findOne({ _id: id, userId: user!.id }).lean()

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: job })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch job'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// DELETE /api/jobs/[id] - Delete a saved job
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    const { id } = await params

    await connectToDatabase()

    const job = await ScrapedJob.findOneAndDelete({ _id: id, userId: user!.id })

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: job })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete job'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
