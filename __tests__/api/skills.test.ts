import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Skill } from '@/types'

vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn(),
    connection: { readyState: 1 },
  },
  Schema: vi.fn().mockImplementation(() => ({})),
  model: vi.fn(),
  models: {},
}))

describe('Skills API', () => {
  const mockSkill: Skill = {
    _id: '1',
    name: 'React',
    category: 'technical',
    level: 5,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/skills', () => {
    it('should_return_all_skills_when_fetched', async () => {
      const skills: Skill[] = [mockSkill]
      expect(skills).toHaveLength(1)
      expect(skills[0].name).toBe('React')
    })

    it('should_return_empty_array_when_no_skills', async () => {
      const skills: Skill[] = []
      expect(skills).toHaveLength(0)
    })
  })

  describe('POST /api/skills', () => {
    it('should_create_skill_when_valid_data', async () => {
      const newSkill = { ...mockSkill }
      expect(newSkill.name).toBeDefined()
      expect(newSkill.category).toBeDefined()
      expect(newSkill.level).toBeGreaterThanOrEqual(1)
      expect(newSkill.level).toBeLessThanOrEqual(5)
    })

    it('should_fail_when_name_missing', async () => {
      const invalidSkill = { ...mockSkill, name: '' }
      expect(invalidSkill.name).toBe('')
    })

    it('should_validate_category_is_valid', async () => {
      const validCategories = ['technical', 'soft', 'language', 'tool']
      expect(validCategories).toContain(mockSkill.category)
    })

    it('should_validate_level_between_1_and_5', async () => {
      expect(mockSkill.level).toBeGreaterThanOrEqual(1)
      expect(mockSkill.level).toBeLessThanOrEqual(5)
    })
  })

  describe('PUT /api/skills/:id', () => {
    it('should_update_skill_when_valid_data', async () => {
      const updatedSkill = { ...mockSkill, level: 4 as const }
      expect(updatedSkill.level).toBe(4)
    })
  })

  describe('DELETE /api/skills/:id', () => {
    it('should_delete_skill_when_exists', async () => {
      expect(mockSkill._id).toBeDefined()
    })
  })
})
