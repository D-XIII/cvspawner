import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/models/User'

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const body = await request.json()

    const { email, password, name } = body

    if (!email?.trim()) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: 'Invalid email format' }, { status: 400 })
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name?.trim() || '',
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create account'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
