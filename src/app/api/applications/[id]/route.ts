import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth-utils'
import Application from '@/models/Application'

type RouteParams = { params: Promise<{ id: string }> }
const validStatuses = ['draft', 'sent', 'followed_up', 'interview', 'rejected', 'accepted']

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    await connectToDatabase()
    const { id } = await params
    const application = await Application.findOne({ _id: id, userId: user!.id })

    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: application })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch application'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    await connectToDatabase()
    const { id } = await params
    const body = await request.json()

    if (body.company !== undefined && !body.company?.trim()) {
      return NextResponse.json({ success: false, error: 'Company cannot be empty' }, { status: 400 })
    }
    if (body.position !== undefined && !body.position?.trim()) {
      return NextResponse.json({ success: false, error: 'Position cannot be empty' }, { status: 400 })
    }
    if (body.status !== undefined && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: `Status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (body.company) updateData.company = body.company.trim()
    if (body.position) updateData.position = body.position.trim()
    if (body.location !== undefined) updateData.location = body.location?.trim() || ''
    if (body.url !== undefined) updateData.url = body.url?.trim() || ''
    if (body.status) updateData.status = body.status
    if (body.appliedAt !== undefined) updateData.appliedAt = body.appliedAt ? new Date(body.appliedAt) : null
    if (body.notes !== undefined) updateData.notes = body.notes?.trim() || ''

    const application = await Application.findOneAndUpdate(
      { _id: id, userId: user!.id },
      updateData,
      { new: true }
    )

    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: application })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update application'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    await connectToDatabase()
    const { id } = await params
    const application = await Application.findOneAndDelete({ _id: id, userId: user!.id })

    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: { message: 'Application deleted' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete application'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
