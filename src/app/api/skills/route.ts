import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth-utils'
import Skill from '@/models/Skill'

const validCategories = ['technical', 'soft', 'language', 'tool']

export async function GET() {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    await connectToDatabase()
    const skills = await Skill.find({ userId: user!.id }).sort({ category: 1, level: -1 })
    return NextResponse.json({ success: true, data: skills })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch skills'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    await connectToDatabase()
    const body = await request.json()

    if (!body.name?.trim()) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 })
    }
    if (!body.category || !validCategories.includes(body.category)) {
      return NextResponse.json(
        { success: false, error: `Category must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      )
    }
    if (!body.level || body.level < 1 || body.level > 5) {
      return NextResponse.json({ success: false, error: 'Level must be between 1 and 5' }, { status: 400 })
    }

    const skill = await Skill.create({
      userId: user!.id,
      name: body.name.trim(),
      category: body.category,
      level: body.level,
    })

    return NextResponse.json({ success: true, data: skill }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create skill'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
