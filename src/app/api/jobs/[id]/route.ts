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

// PATCH /api/jobs/[id] - Update job status (save/apply)
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    const { id } = await params
    const body = await request.json()

    await connectToDatabase()

    const updateData: Record<string, unknown> = {}

    // Handle status updates
    if (body.status) {
      const validStatuses = ['scraped', 'saved', 'applied']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status' },
          { status: 400 }
        )
      }
      updateData.status = body.status

      // Set appliedAt when marking as applied
      if (body.status === 'applied') {
        updateData.appliedAt = new Date()
      }
    }

    // Handle score updates
    if (body.compatibilityScore !== undefined) {
      updateData.compatibilityScore = body.compatibilityScore
      updateData.scoreStatus = 'completed'
      updateData.scoreCalculatedAt = new Date()
    }

    if (body.scoreStatus) {
      updateData.scoreStatus = body.scoreStatus
    }

    if (body.scoreError) {
      updateData.scoreError = body.scoreError
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const job = await ScrapedJob.findOneAndUpdate(
      { _id: id, userId: user!.id },
      { $set: updateData },
      { new: true }
    ).lean()

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: job })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update job'
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
