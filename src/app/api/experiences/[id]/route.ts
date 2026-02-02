import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth-utils'
import Experience from '@/models/Experience'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    await connectToDatabase()
    const { id } = await params
    const experience = await Experience.findOne({ _id: id, userId: user!.id })

    if (!experience) {
      return NextResponse.json({ success: false, error: 'Experience not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: experience })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch experience'
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

    if (body.title !== undefined && !body.title?.trim()) {
      return NextResponse.json({ success: false, error: 'Title cannot be empty' }, { status: 400 })
    }
    if (body.company !== undefined && !body.company?.trim()) {
      return NextResponse.json({ success: false, error: 'Company cannot be empty' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (body.title) updateData.title = body.title.trim()
    if (body.company) updateData.company = body.company.trim()
    if (body.location !== undefined) updateData.location = body.location?.trim() || ''
    if (body.startDate) updateData.startDate = new Date(body.startDate)
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null
    if (body.current !== undefined) updateData.current = body.current
    if (body.description) updateData.description = body.description.trim()
    if (body.skills) updateData.skills = body.skills

    const experience = await Experience.findOneAndUpdate(
      { _id: id, userId: user!.id },
      updateData,
      { new: true }
    )

    if (!experience) {
      return NextResponse.json({ success: false, error: 'Experience not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: experience })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update experience'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    await connectToDatabase()
    const { id } = await params
    const experience = await Experience.findOneAndDelete({ _id: id, userId: user!.id })

    if (!experience) {
      return NextResponse.json({ success: false, error: 'Experience not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: { message: 'Experience deleted' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete experience'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
