import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth-utils'
import Skill from '@/models/Skill'

type RouteParams = { params: Promise<{ id: string }> }
const validCategories = ['technical', 'soft', 'language', 'tool']

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    await connectToDatabase()
    const { id } = await params
    const skill = await Skill.findOne({ _id: id, userId: user!.id })

    if (!skill) {
      return NextResponse.json({ success: false, error: 'Skill not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: skill })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch skill'
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

    if (body.name !== undefined && !body.name?.trim()) {
      return NextResponse.json({ success: false, error: 'Name cannot be empty' }, { status: 400 })
    }
    if (body.category !== undefined && !validCategories.includes(body.category)) {
      return NextResponse.json(
        { success: false, error: `Category must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      )
    }
    if (body.level !== undefined && (body.level < 1 || body.level > 5)) {
      return NextResponse.json({ success: false, error: 'Level must be between 1 and 5' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (body.name) updateData.name = body.name.trim()
    if (body.category) updateData.category = body.category
    if (body.level) updateData.level = body.level

    const skill = await Skill.findOneAndUpdate(
      { _id: id, userId: user!.id },
      updateData,
      { new: true }
    )

    if (!skill) {
      return NextResponse.json({ success: false, error: 'Skill not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: skill })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update skill'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    await connectToDatabase()
    const { id } = await params
    const skill = await Skill.findOneAndDelete({ _id: id, userId: user!.id })

    if (!skill) {
      return NextResponse.json({ success: false, error: 'Skill not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: { message: 'Skill deleted' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete skill'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
