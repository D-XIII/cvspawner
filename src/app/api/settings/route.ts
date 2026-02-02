import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth-utils'
import Settings from '@/models/Settings'
import { encrypt } from '@/lib/encryption'
import { LLMProvider } from '@/types'

const VALID_PROVIDERS: LLMProvider[] = ['claude', 'openai', 'gemini']

export async function GET() {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    await connectToDatabase()

    const settings = await Settings.findOne({ userId: user!.id })

    if (!settings) {
      return NextResponse.json({
        success: true,
        data: {
          isConfigured: false,
          provider: null,
        },
      })
    }

    // Never return the encrypted API key to the client
    return NextResponse.json({
      success: true,
      data: {
        provider: settings.provider,
        isConfigured: settings.isConfigured,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch settings'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    await connectToDatabase()

    const body = await request.json()
    const { provider, apiKey } = body

    // Validation
    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'Provider is required' },
        { status: 400 }
      )
    }

    if (!VALID_PROVIDERS.includes(provider)) {
      return NextResponse.json(
        { success: false, error: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(', ')}` },
        { status: 400 }
      )
    }

    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      return NextResponse.json(
        { success: false, error: 'API key is required' },
        { status: 400 }
      )
    }

    // Check if settings already exist
    const existingSettings = await Settings.findOne({ userId: user!.id })
    if (existingSettings) {
      return NextResponse.json(
        { success: false, error: 'Settings already exist. Use PUT to update.' },
        { status: 409 }
      )
    }

    // Encrypt the API key before storing
    const encryptedApiKey = encrypt(apiKey.trim())

    const settings = await Settings.create({
      userId: user!.id,
      provider,
      encryptedApiKey,
      isConfigured: true,
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          provider: settings.provider,
          isConfigured: settings.isConfigured,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create settings'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    await connectToDatabase()

    const body = await request.json()
    const { provider, apiKey } = body

    // Check if settings exist
    const existingSettings = await Settings.findOne({ userId: user!.id })
    if (!existingSettings) {
      return NextResponse.json(
        { success: false, error: 'No settings found. Use POST to create.' },
        { status: 404 }
      )
    }

    // Build update object
    const updateData: Record<string, unknown> = {}

    if (provider) {
      if (!VALID_PROVIDERS.includes(provider)) {
        return NextResponse.json(
          { success: false, error: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(', ')}` },
          { status: 400 }
        )
      }
      updateData.provider = provider
    }

    if (apiKey && typeof apiKey === 'string' && apiKey.trim()) {
      updateData.encryptedApiKey = encrypt(apiKey.trim())
      updateData.isConfigured = true
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const settings = await Settings.findOneAndUpdate(
      { userId: user!.id },
      { $set: updateData },
      { new: true }
    )

    return NextResponse.json({
      success: true,
      data: {
        provider: settings!.provider,
        isConfigured: settings!.isConfigured,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update settings'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    await connectToDatabase()

    const result = await Settings.findOneAndDelete({ userId: user!.id })

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'No settings found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete settings'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
