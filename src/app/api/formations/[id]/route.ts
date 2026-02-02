import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth-utils'
import Formation from '@/models/Formation'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    await connectToDatabase()
    const { id } = await params
    const formation = await Formation.findOne({ _id: id, userId: user!.id })

    if (!formation) {
      return NextResponse.json({ success: false, error: 'Formation not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: formation })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch formation'
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

    if (body.degree !== undefined && !body.degree?.trim()) {
      return NextResponse.json({ success: false, error: 'Degree cannot be empty' }, { status: 400 })
    }
    if (body.school !== undefined && !body.school?.trim()) {
      return NextResponse.json({ success: false, error: 'School cannot be empty' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (body.degree) updateData.degree = body.degree.trim()
    if (body.school) updateData.school = body.school.trim()
    if (body.location !== undefined) updateData.location = body.location?.trim() || ''
    if (body.startDate) updateData.startDate = new Date(body.startDate)
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null
    if (body.current !== undefined) updateData.current = body.current
    if (body.description !== undefined) updateData.description = body.description?.trim() || ''

    const formation = await Formation.findOneAndUpdate(
      { _id: id, userId: user!.id },
      updateData,
      { new: true }
    )

    if (!formation) {
      return NextResponse.json({ success: false, error: 'Formation not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: formation })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update formation'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    await connectToDatabase()
    const { id } = await params
    const formation = await Formation.findOneAndDelete({ _id: id, userId: user!.id })

    if (!formation) {
      return NextResponse.json({ success: false, error: 'Formation not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: { message: 'Formation deleted' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete formation'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
