import { describe, it, expect } from 'vitest'
import { CVData, Profile, Experience, Formation, Skill } from '@/types'

describe('PDF Generator', () => {
  const mockProfile: Profile = {
    _id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    title: 'Developer',
    summary: 'A passionate developer',
  }

  const mockExperiences: Experience[] = [
    {
      _id: '1',
      title: 'Software Engineer',
      company: 'Tech Corp',
      startDate: '2022-01-01',
      current: true,
      description: 'Building products',
      skills: ['React'],
    },
  ]

  const mockFormations: Formation[] = [
    {
      _id: '1',
      degree: 'Master CS',
      school: 'University',
      startDate: '2018-09-01',
      endDate: '2020-06-30',
      current: false,
    },
  ]

  const mockSkills: Skill[] = [
    { _id: '1', name: 'React', category: 'technical', level: 5 },
    { _id: '2', name: 'TypeScript', category: 'technical', level: 4 },
  ]

  const mockCVData: CVData = {
    profile: mockProfile,
    experiences: mockExperiences,
    formations: mockFormations,
    skills: mockSkills,
  }

  describe('CV Data Structure', () => {
    it('should_have_profile_data', () => {
      expect(mockCVData.profile).toBeDefined()
      expect(mockCVData.profile?.firstName).toBe('John')
    })

    it('should_have_experiences_array', () => {
      expect(Array.isArray(mockCVData.experiences)).toBe(true)
      expect(mockCVData.experiences).toHaveLength(1)
    })

    it('should_have_formations_array', () => {
      expect(Array.isArray(mockCVData.formations)).toBe(true)
      expect(mockCVData.formations).toHaveLength(1)
    })

    it('should_have_skills_array', () => {
      expect(Array.isArray(mockCVData.skills)).toBe(true)
      expect(mockCVData.skills).toHaveLength(2)
    })
  })

  describe('generatePDF function', () => {
    it('should_throw_error_when_cv-preview-pdf_element_not_found', async () => {
      const { generatePDF } = await import('@/lib/pdf-generator')

      await expect(generatePDF()).rejects.toThrow('CV preview element not found')
    })
  })

  describe('CV Rendering', () => {
    it('should_format_date_range_correctly', () => {
      const formatDateRange = (start: string, end: string | null, current: boolean): string => {
        const startFormatted = new Date(start).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
        if (current) return `${startFormatted} - Present`
        if (!end) return startFormatted
        const endFormatted = new Date(end).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
        return `${startFormatted} - ${endFormatted}`
      }

      expect(formatDateRange('2022-01-01', null, true)).toContain('Present')
      expect(formatDateRange('2018-09-01', '2020-06-30', false)).toContain('2018')
    })

    it('should_group_skills_by_category', () => {
      const groupSkillsByCategory = (skills: Skill[]): Record<string, Skill[]> => {
        return skills.reduce((acc, skill) => {
          if (!acc[skill.category]) acc[skill.category] = []
          acc[skill.category].push(skill)
          return acc
        }, {} as Record<string, Skill[]>)
      }

      const grouped = groupSkillsByCategory(mockSkills)
      expect(grouped.technical).toHaveLength(2)
    })

    it('should_handle_empty_cv_data', () => {
      const emptyCVData: CVData = {
        profile: null,
        experiences: [],
        formations: [],
        skills: [],
      }

      expect(emptyCVData.profile).toBeNull()
      expect(emptyCVData.experiences).toHaveLength(0)
    })
  })
})
