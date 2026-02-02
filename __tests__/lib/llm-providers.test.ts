import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Profile, Experience, Formation, Skill } from '@/types'

// Create a mock for the messages.create method
const mockMessagesCreate = vi.fn()

// Mock the Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: mockMessagesCreate,
      },
    })),
  }
})

import { translateWithClaude, translateCV } from '@/lib/llm-providers'

describe('LLM Providers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('translateWithClaude', () => {
    it('should call Anthropic API with correct parameters', async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Translated text' }],
      })

      const result = await translateWithClaude('Hello world', 'fr', 'test-api-key')

      expect(mockMessagesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.stringContaining('claude'),
          max_tokens: expect.any(Number),
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining('Hello world'),
            }),
          ]),
        })
      )
      expect(result).toBe('Translated text')
    })

    it('should handle API errors gracefully', async () => {
      mockMessagesCreate.mockRejectedValue(new Error('API Error'))

      await expect(translateWithClaude('Hello', 'fr', 'test-key')).rejects.toThrow('API Error')
    })

    it('should return empty string unchanged', async () => {
      const result = await translateWithClaude('', 'fr', 'test-key')
      expect(result).toBe('')
      expect(mockMessagesCreate).not.toHaveBeenCalled()
    })

    it('should return original text if target is same as detected', async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Bonjour' }],
      })

      const result = await translateWithClaude('Bonjour', 'fr', 'test-key')
      expect(result).toBe('Bonjour')
    })
  })

  describe('translateCV', () => {
    const mockProfile: Profile = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      title: 'Software Engineer',
      summary: 'Experienced developer with 5 years of experience.',
    }

    const mockExperiences: Experience[] = [
      {
        _id: '1',
        title: 'Senior Developer',
        company: 'Tech Corp',
        description: 'Built scalable applications.',
        startDate: '2020-01-01',
        current: true,
        skills: ['React', 'Node.js'],
      },
    ]

    const mockFormations: Formation[] = [
      {
        _id: '1',
        degree: 'Master in Computer Science',
        school: 'MIT',
        startDate: '2015-09-01',
        endDate: '2017-06-01',
        current: false,
      },
    ]

    const mockSkills: Skill[] = [
      { _id: '1', name: 'JavaScript', category: 'technical', level: 5 },
      { _id: '2', name: 'French', category: 'language', level: 5 },
    ]

    it('should translate profile fields', async () => {
      // Mock batch translation response
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: 'text', text: '[0] Ingénieur Logiciel\n\n[1] Développeur expérimenté avec 5 ans d\'expérience.' }],
      })

      const result = await translateCV(
        {
          profile: mockProfile,
          experiences: [],
          formations: [],
          skills: [],
        },
        'fr',
        'test-key'
      )

      expect(result.profile?.title).toBe('Ingénieur Logiciel')
    })

    it('should not translate names, companies, schools, skills', async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: 'text', text: '[0] Titre traduit\n\n[1] Summary traduit\n\n[2] Dev Senior\n\n[3] Description traduite\n\n[4] Master traduit' }],
      })

      const result = await translateCV(
        {
          profile: mockProfile,
          experiences: mockExperiences,
          formations: mockFormations,
          skills: mockSkills,
        },
        'fr',
        'test-key'
      )

      // These should NOT be translated
      expect(result.profile?.firstName).toBe('John')
      expect(result.profile?.lastName).toBe('Doe')
      expect(result.profile?.email).toBe('john@example.com')
      expect(result.experiences[0].company).toBe('Tech Corp')
      expect(result.formations[0].school).toBe('MIT')
      expect(result.skills[0].name).toBe('JavaScript')
    })

    it('should handle empty CV data', async () => {
      const result = await translateCV(
        {
          profile: null,
          experiences: [],
          formations: [],
          skills: [],
        },
        'fr',
        'test-key'
      )

      expect(result.profile).toBeNull()
      expect(result.experiences).toEqual([])
      expect(result.formations).toEqual([])
      expect(result.skills).toEqual([])
      expect(mockMessagesCreate).not.toHaveBeenCalled()
    })
  })
})
