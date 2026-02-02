import { TranslationLanguage } from '@/types'

export interface CVLabels {
  experience: string
  education: string
  skills: string
  technicalSkills: string
  softSkills: string
  languages: string
  tools: string
  present: string
  profile: string
  contact: string
}

const translations: Record<TranslationLanguage, CVLabels> = {
  en: {
    experience: 'Experience',
    education: 'Education',
    skills: 'Skills',
    technicalSkills: 'Technical Skills',
    softSkills: 'Soft Skills',
    languages: 'Languages',
    tools: 'Tools',
    present: 'Present',
    profile: 'Profile',
    contact: 'Contact',
  },
  fr: {
    experience: 'Expérience',
    education: 'Formation',
    skills: 'Compétences',
    technicalSkills: 'Compétences Techniques',
    softSkills: 'Savoir-être',
    languages: 'Langues',
    tools: 'Outils',
    present: 'Présent',
    profile: 'Profil',
    contact: 'Contact',
  },
}

export function getLabels(language: TranslationLanguage): CVLabels {
  return translations[language]
}

export function getCategoryLabel(category: string, language: TranslationLanguage): string {
  const labels = translations[language]
  const categoryMap: Record<string, keyof CVLabels> = {
    technical: 'technicalSkills',
    soft: 'softSkills',
    language: 'languages',
    tool: 'tools',
  }
  const labelKey = categoryMap[category]
  return labelKey ? labels[labelKey] : category
}
