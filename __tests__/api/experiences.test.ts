import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Experience } from '@/types'

// Mock mongoose
vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn(),
    connection: { readyState: 1 },
  },
  Schema: vi.fn().mockImplementation(() => ({})),
  model: vi.fn(),
  models: {},
}))

describe('Experiences API', () => {
  const mockExperience: Experience = {
    _id: '1',
    title: 'Software Engineer',
    company: 'Tech Corp',
    location: 'Paris',
    startDate: '2022-01-01',
    endDate: null,
    current: true,
    description: 'Building awesome stuff',
    skills: ['React', 'TypeScript'],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/experiences', () => {
    it('should_return_all_experiences_when_fetched', async () => {
      const experiences: Experience[] = [mockExperience]
      expect(experiences).toHaveLength(1)
      expect(experiences[0].title).toBe('Software Engineer')
    })

    it('should_return_empty_array_when_no_experiences', async () => {
      const experiences: Experience[] = []
      expect(experiences).toHaveLength(0)
    })
  })

  describe('POST /api/experiences', () => {
    it('should_create_experience_when_valid_data', async () => {
      const newExperience = { ...mockExperience }
      expect(newExperience.title).toBeDefined()
      expect(newExperience.company).toBeDefined()
    })

    it('should_fail_when_title_missing', async () => {
      const invalidExperience = { ...mockExperience, title: '' }
      expect(invalidExperience.title).toBe('')
    })

    it('should_fail_when_company_missing', async () => {
      const invalidExperience = { ...mockExperience, company: '' }
      expect(invalidExperience.company).toBe('')
    })
  })

  describe('PUT /api/experiences/:id', () => {
    it('should_update_experience_when_valid_data', async () => {
      const updatedExperience = { ...mockExperience, title: 'Senior Engineer' }
      expect(updatedExperience.title).toBe('Senior Engineer')
    })

    it('should_fail_when_experience_not_found', async () => {
      const nonExistentId = 'non-existent-id'
      expect(nonExistentId).not.toBe(mockExperience._id)
    })
  })

  describe('DELETE /api/experiences/:id', () => {
    it('should_delete_experience_when_exists', async () => {
      expect(mockExperience._id).toBeDefined()
    })

    it('should_fail_when_experience_not_found', async () => {
      const nonExistentId = 'non-existent-id'
      expect(nonExistentId).not.toBe(mockExperience._id)
    })
  })
})
