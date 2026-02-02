import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth-utils'
import Profile from '@/models/Profile'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function GET() {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    await connectToDatabase()
    const profile = await Profile.findOne({ userId: user!.id })
    return NextResponse.json({ success: true, data: profile })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch profile'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    await connectToDatabase()
    const body = await request.json()

    if (!body.firstName?.trim()) {
      return NextResponse.json({ success: false, error: 'First name is required' }, { status: 400 })
    }
    if (!body.lastName?.trim()) {
      return NextResponse.json({ success: false, error: 'Last name is required' }, { status: 400 })
    }
    if (!body.email?.trim()) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })
    }
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({ success: false, error: 'Invalid email format' }, { status: 400 })
    }

    // Check if user already has a profile
    const existingProfile = await Profile.findOne({ userId: user!.id })
    if (existingProfile) {
      return NextResponse.json({ success: false, error: 'Profile already exists. Use PUT to update.' }, { status: 400 })
    }

    const profile = await Profile.create({
      userId: user!.id,
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone?.trim() || '',
      address: body.address?.trim() || '',
      title: body.title?.trim() || '',
      summary: body.summary?.trim() || '',
      linkedin: body.linkedin?.trim() || '',
      github: body.github?.trim() || '',
      website: body.website?.trim() || '',
    })

    return NextResponse.json({ success: true, data: profile }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create profile'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    await connectToDatabase()
    const body = await request.json()

    if (body.firstName !== undefined && !body.firstName?.trim()) {
      return NextResponse.json({ success: false, error: 'First name cannot be empty' }, { status: 400 })
    }
    if (body.lastName !== undefined && !body.lastName?.trim()) {
      return NextResponse.json({ success: false, error: 'Last name cannot be empty' }, { status: 400 })
    }
    if (body.email !== undefined) {
      if (!body.email?.trim()) {
        return NextResponse.json({ success: false, error: 'Email cannot be empty' }, { status: 400 })
      }
      if (!emailRegex.test(body.email)) {
        return NextResponse.json({ success: false, error: 'Invalid email format' }, { status: 400 })
      }
    }

    const updateData: Record<string, unknown> = {}
    if (body.firstName) updateData.firstName = body.firstName.trim()
    if (body.lastName) updateData.lastName = body.lastName.trim()
    if (body.email) updateData.email = body.email.trim().toLowerCase()
    if (body.phone !== undefined) updateData.phone = body.phone?.trim() || ''
    if (body.address !== undefined) updateData.address = body.address?.trim() || ''
    if (body.title !== undefined) updateData.title = body.title?.trim() || ''
    if (body.summary !== undefined) updateData.summary = body.summary?.trim() || ''
    if (body.linkedin !== undefined) updateData.linkedin = body.linkedin?.trim() || ''
    if (body.github !== undefined) updateData.github = body.github?.trim() || ''
    if (body.website !== undefined) updateData.website = body.website?.trim() || ''

    const profile = await Profile.findOneAndUpdate(
      { userId: user!.id },
      updateData,
      { new: true }
    )

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Profile not found. Create one first.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: profile })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update profile'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
