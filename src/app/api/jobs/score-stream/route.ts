import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { getAuthenticatedUser } from '@/lib/auth-utils'
import Profile from '@/models/Profile'
import Experience from '@/models/Experience'
import Skill from '@/models/Skill'
import ScrapedJob from '@/models/ScrapedJob'

const SCRAPER_URL = process.env.SCRAPER_URL || 'http://localhost:8000'

interface CVDataForScoring {
  profile: { title?: string; summary?: string } | null
  experiences: Array<{ title?: string; company?: string; description?: string }>
  skills: Array<{ name: string; category?: string }>
}

interface JobForScoring {
  index: number
  id?: string // Database ID for updating scores
  title: string
  company: string
  description?: string
}

async function getUserCVData(userId: string): Promise<CVDataForScoring> {
  const [profile, experiences, skills] = await Promise.all([
    Profile.findOne({ userId }).lean(),
    Experience.find({ userId }).lean(),
    Skill.find({ userId }).lean(),
  ])

  return {
    profile: profile ? { title: profile.title, summary: profile.summary } : null,
    experiences: experiences.map((exp) => ({
      title: exp.title,
      company: exp.company,
      description: exp.description,
    })),
    skills: skills.map((skill) => ({
      name: skill.name,
      category: skill.category,
    })),
  }
}

function isCVEmpty(cvData: CVDataForScoring): boolean {
  const hasProfile = cvData.profile && (cvData.profile.title || cvData.profile.summary)
  const hasExperiences = cvData.experiences.length > 0
  const hasSkills = cvData.skills.length > 0
  return !hasProfile && !hasExperiences && !hasSkills
}

// POST /api/jobs/score-stream - SSE endpoint for streaming job scores
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Parse request body
    const body = await request.json()
    const jobs: JobForScoring[] = body.jobs

    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return new Response(JSON.stringify({ error: 'jobs array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get user's CV data
    await connectToDatabase()
    const cvData = await getUserCVData(user.id)

    // Check if CV is empty
    if (isCVEmpty(cvData)) {
      return new Response(JSON.stringify({ error: 'cv_empty', message: 'CV is empty' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Create SSE stream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        }

        try {
          // Score each job individually with detailed analysis and stream results
          for (const job of jobs) {
            try {
              const scoreResponse = await fetch(`${SCRAPER_URL}/score-detailed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  cv_data: cvData,
                  job: {
                    id: String(job.index),
                    title: job.title,
                    company: job.company,
                    description: job.description,
                  },
                }),
              })

              if (scoreResponse.ok) {
                const scoreData = await scoreResponse.json()

                // Update score in database if job has an ID
                if (job.id) {
                  await ScrapedJob.findByIdAndUpdate(job.id, {
                    compatibilityScore: scoreData.globalScore,
                    scoreStatus: 'completed',
                    scoreCalculatedAt: new Date(),
                  })
                }

                sendEvent('score', {
                  index: job.index,
                  score: scoreData.globalScore,
                  status: 'completed',
                  details: {
                    globalScore: scoreData.globalScore,
                    experienceMatches: scoreData.experienceMatches,
                    matchedKeywords: scoreData.matchedKeywords,
                    missingKeywords: scoreData.missingKeywords,
                    matchedSkills: scoreData.matchedSkills,
                    totalKeywords: scoreData.totalKeywords,
                  },
                })
              } else {
                // Update error status in database
                if (job.id) {
                  await ScrapedJob.findByIdAndUpdate(job.id, {
                    scoreStatus: 'error',
                    scoreError: 'Scoring service error',
                  })
                }

                sendEvent('score', {
                  index: job.index,
                  score: undefined,
                  status: 'error',
                  error: 'Scoring service error',
                })
              }
            } catch (err) {
              const errorMsg = err instanceof Error ? err.message : 'Unknown error'

              // Update error status in database
              if (job.id) {
                await ScrapedJob.findByIdAndUpdate(job.id, {
                  scoreStatus: 'error',
                  scoreError: errorMsg,
                })
              }

              // Send error for this specific job
              sendEvent('score', {
                index: job.index,
                score: undefined,
                status: 'error',
                error: errorMsg,
              })
            }
          }

          // Send completion event
          sendEvent('done', { total: jobs.length })
        } catch (err) {
          sendEvent('error', { message: err instanceof Error ? err.message : 'Stream error' })
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Score stream error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
