import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth-utils'
import Settings from '@/models/Settings'
import { decrypt } from '@/lib/encryption'
import { translateCV } from '@/lib/llm-providers'
import { TranslationLanguage } from '@/types'

const VALID_LANGUAGES: TranslationLanguage[] = ['fr', 'en']

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    await connectToDatabase()

    // Get user's LLM settings
    const settings = await Settings.findOne({ userId: user!.id })

    if (!settings || !settings.isConfigured) {
      return NextResponse.json(
        {
          success: false,
          error: 'LLM not configured. Please add your API key in Settings.',
        },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { content, targetLanguage } = body

    // Validate target language
    if (!targetLanguage || !VALID_LANGUAGES.includes(targetLanguage)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid target language. Must be one of: ${VALID_LANGUAGES.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Validate content
    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      )
    }

    // Decrypt the API key
    let apiKey: string
    try {
      apiKey = decrypt(settings.encryptedApiKey)
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to decrypt API key. Please reconfigure your LLM settings.',
        },
        { status: 500 }
      )
    }

    // Translate the CV
    try {
      const translatedContent = await translateCV(content, targetLanguage, apiKey)

      return NextResponse.json({
        success: true,
        data: {
          ...translatedContent,
          language: targetLanguage,
        },
      })
    } catch (translationError) {
      const message =
        translationError instanceof Error ? translationError.message : 'Translation failed'

      // Check for common API errors
      if (message.includes('401') || message.includes('invalid_api_key')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid API key. Please check your LLM settings.',
          },
          { status: 401 }
        )
      }

      if (message.includes('429') || message.includes('rate_limit')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Rate limit exceeded. Please try again later.',
          },
          { status: 429 }
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: `Translation failed: ${message}`,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to translate'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
