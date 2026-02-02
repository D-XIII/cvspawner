import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth-utils'
import Experience from '@/models/Experience'

export async function GET() {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    await connectToDatabase()
    const experiences = await Experience.find({ userId: user!.id }).sort({ startDate: -1 })
    return NextResponse.json({ success: true, data: experiences })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch experiences'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    await connectToDatabase()
    const body = await request.json()

    if (!body.title?.trim()) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
    }
    if (!body.company?.trim()) {
      return NextResponse.json({ success: false, error: 'Company is required' }, { status: 400 })
    }
    if (!body.startDate) {
      return NextResponse.json({ success: false, error: 'Start date is required' }, { status: 400 })
    }
    if (!body.description?.trim()) {
      return NextResponse.json({ success: false, error: 'Description is required' }, { status: 400 })
    }

    const experience = await Experience.create({
      userId: user!.id,
      title: body.title.trim(),
      company: body.company.trim(),
      location: body.location?.trim() || '',
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
      current: body.current || false,
      description: body.description.trim(),
      skills: body.skills || [],
    })

    return NextResponse.json({ success: true, data: experience }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create experience'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
