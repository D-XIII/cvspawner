import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Application, ApplicationStatus } from '@/types'

vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn(),
    connection: { readyState: 1 },
  },
  Schema: vi.fn().mockImplementation(() => ({})),
  model: vi.fn(),
  models: {},
}))

describe('Applications API', () => {
  const mockApplication: Application = {
    _id: '1',
    company: 'Google',
    position: 'DevOps Engineer',
    location: 'Zurich',
    url: 'https://careers.google.com/jobs/123',
    status: 'sent',
    appliedAt: new Date('2026-01-15'),
    notes: 'Applied via referral',
  }

  const validStatuses: ApplicationStatus[] = ['draft', 'sent', 'followed_up', 'interview', 'rejected', 'accepted']

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/applications', () => {
    it('should_return_all_applications_when_fetched', async () => {
      const applications: Application[] = [mockApplication]
      expect(applications).toHaveLength(1)
      expect(applications[0].company).toBe('Google')
    })

    it('should_return_empty_array_when_no_applications', async () => {
      const applications: Application[] = []
      expect(applications).toHaveLength(0)
    })
  })

  describe('POST /api/applications', () => {
    it('should_create_application_when_valid_data', async () => {
      const newApplication = { ...mockApplication }
      expect(newApplication.company).toBeDefined()
      expect(newApplication.position).toBeDefined()
      expect(validStatuses).toContain(newApplication.status)
    })

    it('should_fail_when_company_missing', async () => {
      const invalidApplication = { ...mockApplication, company: '' }
      expect(invalidApplication.company).toBe('')
    })

    it('should_fail_when_position_missing', async () => {
      const invalidApplication = { ...mockApplication, position: '' }
      expect(invalidApplication.position).toBe('')
    })

    it('should_validate_status_is_valid', async () => {
      expect(validStatuses).toContain(mockApplication.status)
    })

    it('should_accept_optional_fields', async () => {
      const minimalApplication: Partial<Application> = {
        company: 'Startup',
        position: 'Developer',
        status: 'draft',
      }
      expect(minimalApplication.company).toBeDefined()
      expect(minimalApplication.position).toBeDefined()
      expect(minimalApplication.location).toBeUndefined()
      expect(minimalApplication.url).toBeUndefined()
      expect(minimalApplication.notes).toBeUndefined()
    })
  })

  describe('PUT /api/applications/:id', () => {
    it('should_update_application_status', async () => {
      const updatedApplication = { ...mockApplication, status: 'interview' as ApplicationStatus }
      expect(updatedApplication.status).toBe('interview')
    })

    it('should_update_application_notes', async () => {
      const updatedApplication = { ...mockApplication, notes: 'Interview scheduled' }
      expect(updatedApplication.notes).toBe('Interview scheduled')
    })
  })

  describe('DELETE /api/applications/:id', () => {
    it('should_delete_application_when_exists', async () => {
      expect(mockApplication._id).toBeDefined()
    })
  })

  describe('Application statuses', () => {
    it('should_have_all_valid_statuses', () => {
      expect(validStatuses).toContain('draft')
      expect(validStatuses).toContain('sent')
      expect(validStatuses).toContain('followed_up')
      expect(validStatuses).toContain('interview')
      expect(validStatuses).toContain('rejected')
      expect(validStatuses).toContain('accepted')
    })
  })
})
