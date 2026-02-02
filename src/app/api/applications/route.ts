import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Application from '@/models/Application'

const validStatuses = ['draft', 'sent', 'followed_up', 'interview', 'rejected', 'accepted']

export async function GET() {
  try {
    await connectToDatabase()
    const applications = await Application.find().sort({ updatedAt: -1 })
    return NextResponse.json({ success: true, data: applications })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch applications'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const body = await request.json()

    if (!body.company?.trim()) {
      return NextResponse.json({ success: false, error: 'Company is required' }, { status: 400 })
    }
    if (!body.position?.trim()) {
      return NextResponse.json({ success: false, error: 'Position is required' }, { status: 400 })
    }
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: `Status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const application = await Application.create({
      company: body.company.trim(),
      position: body.position.trim(),
      location: body.location?.trim() || '',
      url: body.url?.trim() || '',
      status: body.status || 'draft',
      appliedAt: body.appliedAt ? new Date(body.appliedAt) : null,
      notes: body.notes?.trim() || '',
    })

    return NextResponse.json({ success: true, data: application }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create application'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
