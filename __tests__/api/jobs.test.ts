import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock auth
vi.mock('@/lib/auth-utils', () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: { id: 'user123' }, error: null }),
}))

// Mock MongoDB
vi.mock('@/lib/mongodb', () => ({
  connectToDatabase: vi.fn().mockResolvedValue({}),
}))

// Mock ScrapedJob model
const mockJobs = [
  {
    _id: 'job1',
    userId: 'user123',
    title: 'Software Engineer',
    company: 'Tech Corp',
    location: 'Geneva',
    jobUrl: 'https://example.com/job1',
    isRemote: false,
    site: 'indeed',
    savedAt: new Date(),
  },
  {
    _id: 'job2',
    userId: 'user123',
    title: 'Frontend Developer',
    company: 'Startup Inc',
    location: 'Zurich',
    jobUrl: 'https://example.com/job2',
    isRemote: true,
    site: 'linkedin',
    savedAt: new Date(),
  },
]

vi.mock('@/models/ScrapedJob', () => {
  const mockModel = {
    find: vi.fn().mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockJobs),
      }),
    }),
    create: vi.fn().mockImplementation((data) => Promise.resolve({ _id: 'newjob', ...data })),
    findOneAndDelete: vi.fn().mockResolvedValue(mockJobs[0]),
    findOneAndUpdate: vi.fn().mockResolvedValue(mockJobs[0]),
    deleteMany: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    findOne: vi.fn().mockResolvedValue(null),
  }
  return { default: mockModel }
})

describe('Jobs API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/jobs', () => {
    it('should return saved jobs for authenticated user', async () => {
      const { GET } = await import('@/app/api/jobs/route')
      const request = new NextRequest('http://localhost:3000/api/jobs')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.data[0].title).toBe('Software Engineer')
    })

    it('should return 401 for unauthenticated user', async () => {
      const { requireAuth } = await import('@/lib/auth-utils')
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: null,
        error: new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 }),
      })

      const { GET } = await import('@/app/api/jobs/route')
      const request = new NextRequest('http://localhost:3000/api/jobs')

      const response = await GET(request)

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/jobs', () => {
    it('should save a new job', async () => {
      const { POST } = await import('@/app/api/jobs/route')
      const jobData = {
        title: 'Backend Developer',
        company: 'New Corp',
        location: 'Remote',
        jobUrl: 'https://example.com/newjob',
        isRemote: true,
        site: 'glassdoor',
      }

      const request = new NextRequest('http://localhost:3000/api/jobs', {
        method: 'POST',
        body: JSON.stringify(jobData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.title).toBe('Backend Developer')
    })

    it('should return 400 for invalid job data', async () => {
      const { POST } = await import('@/app/api/jobs/route')
      const invalidData = { company: 'No Title Corp' } // Missing required title

      const request = new NextRequest('http://localhost:3000/api/jobs', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })

  describe('DELETE /api/jobs/[id]', () => {
    it('should delete a saved job', async () => {
      const { DELETE } = await import('@/app/api/jobs/[id]/route')
      const request = new NextRequest('http://localhost:3000/api/jobs/job1', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: 'job1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
})

describe('Scrape API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  describe('POST /api/jobs/scrape', () => {
    it('should proxy scrape request to Python service', async () => {
      const mockScrapedJobs = [
        { title: 'Dev Job', company: 'Test Co', site: 'indeed', is_remote: false },
      ]

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, jobs: mockScrapedJobs, total: 1 }),
      } as Response)

      const { POST } = await import('@/app/api/jobs/scrape/route')
      const request = new NextRequest('http://localhost:3000/api/jobs/scrape', {
        method: 'POST',
        body: JSON.stringify({
          searchTerm: 'Software Engineer',
          location: 'Switzerland',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.jobs).toHaveLength(1)
    })

    it('should return 400 for missing search term', async () => {
      const { POST } = await import('@/app/api/jobs/scrape/route')
      const request = new NextRequest('http://localhost:3000/api/jobs/scrape', {
        method: 'POST',
        body: JSON.stringify({ location: 'Switzerland' }), // Missing searchTerm
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('searchTerm')
    })

    it('should handle scraper service errors', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Service unavailable'))

      const { POST } = await import('@/app/api/jobs/scrape/route')
      const request = new NextRequest('http://localhost:3000/api/jobs/scrape', {
        method: 'POST',
        body: JSON.stringify({
          searchTerm: 'Developer',
          location: 'Geneva',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.success).toBe(false)
    })
  })
})
