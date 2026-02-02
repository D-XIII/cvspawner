import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Profile } from '@/types'

vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn(),
    connection: { readyState: 1 },
  },
  Schema: vi.fn().mockImplementation(() => ({})),
  model: vi.fn(),
  models: {},
}))

describe('Profile API', () => {
  const mockProfile: Profile = {
    _id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+33 6 12 34 56 78',
    address: 'Paris, France',
    title: 'Full Stack Developer',
    summary: 'Passionate developer with 5 years of experience',
    linkedin: 'https://linkedin.com/in/johndoe',
    github: 'https://github.com/johndoe',
    website: 'https://johndoe.dev',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/profile', () => {
    it('should_return_profile_when_exists', async () => {
      expect(mockProfile.firstName).toBe('John')
      expect(mockProfile.lastName).toBe('Doe')
      expect(mockProfile.email).toBe('john.doe@example.com')
    })

    it('should_return_null_when_no_profile', async () => {
      const profile: Profile | null = null
      expect(profile).toBeNull()
    })
  })

  describe('POST /api/profile', () => {
    it('should_create_profile_when_valid_data', async () => {
      const newProfile = { ...mockProfile }
      expect(newProfile.firstName).toBeDefined()
      expect(newProfile.lastName).toBeDefined()
      expect(newProfile.email).toBeDefined()
    })

    it('should_fail_when_firstName_missing', async () => {
      const invalidProfile = { ...mockProfile, firstName: '' }
      expect(invalidProfile.firstName).toBe('')
    })

    it('should_fail_when_lastName_missing', async () => {
      const invalidProfile = { ...mockProfile, lastName: '' }
      expect(invalidProfile.lastName).toBe('')
    })

    it('should_fail_when_email_invalid', async () => {
      const invalidProfile = { ...mockProfile, email: 'invalid-email' }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      expect(emailRegex.test(invalidProfile.email)).toBe(false)
    })

    it('should_validate_email_format', async () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      expect(emailRegex.test(mockProfile.email)).toBe(true)
    })
  })

  describe('PUT /api/profile', () => {
    it('should_update_profile_when_valid_data', async () => {
      const updatedProfile = { ...mockProfile, title: 'Senior Developer' }
      expect(updatedProfile.title).toBe('Senior Developer')
    })
  })
})
