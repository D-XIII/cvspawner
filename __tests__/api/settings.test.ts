import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

// Mock auth utils
vi.mock('@/lib/auth-utils', () => ({
  requireAuth: vi.fn(),
}))

// Mock mongodb
vi.mock('@/lib/mongodb', () => ({
  connectToDatabase: vi.fn(),
}))

// Mock encryption
vi.mock('@/lib/encryption', () => ({
  encrypt: vi.fn((val: string) => `encrypted_${val}`),
  decrypt: vi.fn((val: string) => val.replace('encrypted_', '')),
}))

// Mock Settings model with factory
vi.mock('@/models/Settings', () => {
  const mockModel = {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findOneAndDelete: vi.fn(),
    create: vi.fn(),
  }
  return { default: mockModel }
})

import { requireAuth } from '@/lib/auth-utils'
import Settings from '@/models/Settings'
import { GET, POST, PUT, DELETE } from '@/app/api/settings/route'

describe('Settings API', () => {
  const mockUser = { id: 'user-123', email: 'test@test.com' }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAuth).mockResolvedValue({ user: mockUser, error: null })
  })

  describe('GET /api/settings', () => {
    it('should return 401 if not authenticated', async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        user: null,
        error: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }),
      })

      const response = await GET()
      expect(response.status).toBe(401)
    })

    it('should return settings if they exist', async () => {
      const settings = {
        userId: 'user-123',
        provider: 'claude',
        encryptedApiKey: 'encrypted_sk-test',
        isConfigured: true,
      }
      vi.mocked(Settings.findOne).mockResolvedValue(settings as any)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.provider).toBe('claude')
      expect(data.data.isConfigured).toBe(true)
      // API key should NOT be returned
      expect(data.data.apiKey).toBeUndefined()
      expect(data.data.encryptedApiKey).toBeUndefined()
    })

    it('should return default settings if none exist', async () => {
      vi.mocked(Settings.findOne).mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.isConfigured).toBe(false)
    })
  })

  describe('POST /api/settings', () => {
    it('should return 401 if not authenticated', async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        user: null,
        error: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }),
      })

      const request = new Request('http://localhost/api/settings', {
        method: 'POST',
        body: JSON.stringify({ provider: 'claude', apiKey: 'sk-test' }),
      })

      const response = await POST(request)
      expect(response.status).toBe(401)
    })

    it('should create settings with encrypted API key', async () => {
      const createdSettings = {
        userId: 'user-123',
        provider: 'claude',
        encryptedApiKey: 'encrypted_sk-test',
        isConfigured: true,
      }
      vi.mocked(Settings.findOne).mockResolvedValue(null)
      vi.mocked(Settings.create).mockResolvedValue(createdSettings as any)

      const request = new Request('http://localhost/api/settings', {
        method: 'POST',
        body: JSON.stringify({ provider: 'claude', apiKey: 'sk-test' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(Settings.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          provider: 'claude',
          encryptedApiKey: 'encrypted_sk-test',
          isConfigured: true,
        })
      )
    })

    it('should return 400 if provider is missing', async () => {
      const request = new Request('http://localhost/api/settings', {
        method: 'POST',
        body: JSON.stringify({ apiKey: 'sk-test' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should return 400 if apiKey is missing', async () => {
      const request = new Request('http://localhost/api/settings', {
        method: 'POST',
        body: JSON.stringify({ provider: 'claude' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should return 400 if invalid provider', async () => {
      const request = new Request('http://localhost/api/settings', {
        method: 'POST',
        body: JSON.stringify({ provider: 'invalid', apiKey: 'sk-test' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })

  describe('PUT /api/settings', () => {
    it('should update settings', async () => {
      const existingSettings = {
        userId: 'user-123',
        provider: 'claude',
        encryptedApiKey: 'encrypted_old-key',
        isConfigured: true,
      }
      const updatedSettings = {
        ...existingSettings,
        encryptedApiKey: 'encrypted_new-key',
      }
      vi.mocked(Settings.findOne).mockResolvedValue(existingSettings as any)
      vi.mocked(Settings.findOneAndUpdate).mockResolvedValue(updatedSettings as any)

      const request = new Request('http://localhost/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ apiKey: 'new-key' }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 404 if no settings exist', async () => {
      vi.mocked(Settings.findOne).mockResolvedValue(null)

      const request = new Request('http://localhost/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ apiKey: 'new-key' }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
    })
  })

  describe('DELETE /api/settings', () => {
    it('should delete settings', async () => {
      vi.mocked(Settings.findOneAndDelete).mockResolvedValue({ _id: '123' } as any)

      const response = await DELETE()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 404 if no settings to delete', async () => {
      vi.mocked(Settings.findOneAndDelete).mockResolvedValue(null)

      const response = await DELETE()
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
    })
  })
})
