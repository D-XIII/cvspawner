import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth-utils'
import Formation from '@/models/Formation'

export async function GET() {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    await connectToDatabase()
    const formations = await Formation.find({ userId: user!.id }).sort({ startDate: -1 })
    return NextResponse.json({ success: true, data: formations })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch formations'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    await connectToDatabase()
    const body = await request.json()

    if (!body.degree?.trim()) {
      return NextResponse.json({ success: false, error: 'Degree is required' }, { status: 400 })
    }
    if (!body.school?.trim()) {
      return NextResponse.json({ success: false, error: 'School is required' }, { status: 400 })
    }
    if (!body.startDate) {
      return NextResponse.json({ success: false, error: 'Start date is required' }, { status: 400 })
    }

    const formation = await Formation.create({
      userId: user!.id,
      degree: body.degree.trim(),
      school: body.school.trim(),
      location: body.location?.trim() || '',
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
      current: body.current || false,
      description: body.description?.trim() || '',
    })

    return NextResponse.json({ success: true, data: formation }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create formation'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
