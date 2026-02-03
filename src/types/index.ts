export interface Profile {
  _id?: string
  userId?: string
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
  userId?: string
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
  userId?: string
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
  userId?: string
  name: string
  category: 'technical' | 'soft' | 'language' | 'tool'
  level: 1 | 2 | 3 | 4 | 5
  createdAt?: Date
  updatedAt?: Date
}

export type ApplicationStatus = 'draft' | 'sent' | 'followed_up' | 'interview' | 'rejected' | 'accepted'

export interface Application {
  _id?: string
  userId?: string
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

// Job Scraping types
export type ScoreStatus = 'pending' | 'calculating' | 'completed' | 'error'

export interface ScrapedJob {
  _id?: string
  userId?: string
  title: string
  company: string
  location?: string
  jobUrl?: string
  description?: string
  salaryMin?: number
  salaryMax?: number
  salaryCurrency?: string
  datePosted?: string
  jobType?: string
  isRemote: boolean
  site: string
  savedAt?: Date
  // Compatibility score fields
  compatibilityScore?: number
  scoreStatus?: ScoreStatus
  scoreCalculatedAt?: Date
  scoreError?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface ScrapeRequest {
  searchTerm: string
  location?: string
  resultsWanted?: number
  hoursOld?: number
  countryIndeed?: string
  siteNames?: string[]
  remoteOnly?: boolean
}

export interface ScrapeResponse {
  success: boolean
  jobs: ScrapedJob[]
  total: number
  message?: string
}
