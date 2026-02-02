export interface Profile {
  _id?: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  address?: string
  title?: string
  summary?: string
  linkedin?: string
  github?: string
  website?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface Experience {
  _id?: string
  title: string
  company: string
  location?: string
  startDate: Date | string
  endDate?: Date | string | null
  current: boolean
  description: string
  skills: string[]
  createdAt?: Date
  updatedAt?: Date
}

export interface Formation {
  _id?: string
  degree: string
  school: string
  location?: string
  startDate: Date | string
  endDate?: Date | string | null
  current: boolean
  description?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface Skill {
  _id?: string
  name: string
  category: 'technical' | 'soft' | 'language' | 'tool'
  level: 1 | 2 | 3 | 4 | 5
  createdAt?: Date
  updatedAt?: Date
}

export type ApplicationStatus = 'draft' | 'sent' | 'followed_up' | 'interview' | 'rejected' | 'accepted'

export interface Application {
  _id?: string
  company: string
  position: string
  location?: string
  url?: string
  status: ApplicationStatus
  appliedAt?: Date | string | null
  notes?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface CVSelection {
  experiences: string[]
  formations: string[]
  skills: string[]
  includeProfile: boolean
}

export interface CVData {
  profile: Profile | null
  experiences: Experience[]
  formations: Formation[]
  skills: Skill[]
}

export type ApiResponse<T> = {
  success: true
  data: T
} | {
  success: false
  error: string
}
