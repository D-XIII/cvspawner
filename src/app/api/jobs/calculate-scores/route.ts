import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectToDatabase } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth-utils'
import ScrapedJob from '@/models/ScrapedJob'
import Profile from '@/models/Profile'
import Experience from '@/models/Experience'
import Skill from '@/models/Skill'

const SCRAPER_URL = process.env.SCRAPER_URL || 'http://localhost:8000'

interface CVDataForScoring {
  profile: {
    title?: string
    summary?: string
  } | null
  experiences: Array<{
    title?: string
    company?: string
    description?: string
  }>
  skills: Array<{
    name: string
    category?: string
  }>
}

interface JobForScoring {
  id: string
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
    profile: profile
      ? {
          title: profile.title,
          summary: profile.summary,
        }
      : null,
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

// POST /api/jobs/calculate-scores - Calculate scores for pending jobs
export async function POST() {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    await connectToDatabase()

    // Get user's CV data
    const cvData = await getUserCVData(user!.id)

    // Check if CV is empty
    if (isCVEmpty(cvData)) {
      return NextResponse.json({
        success: false,
        error: 'Your CV is empty. Please add profile, experiences, or skills before calculating compatibility scores.',
      }, { status: 400 })
    }

    // Get jobs with pending status or no status (legacy jobs)
    const pendingJobs = await ScrapedJob.find({
      userId: user!.id,
      $or: [
        { scoreStatus: 'pending' },
        { scoreStatus: { $exists: false } },
      ],
    }).lean()

    if (pendingJobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No jobs pending score calculation.',
        processed: 0,
      })
    }

    // Mark jobs as calculating
    const jobIds = pendingJobs.map((job) => job._id)
    await ScrapedJob.updateMany(
      { _id: { $in: jobIds } },
      { $set: { scoreStatus: 'calculating' } }
    )

    // Prepare jobs for batch scoring
    const jobsForScoring: JobForScoring[] = pendingJobs.map((job) => ({
      id: job._id.toString(),
      title: job.title,
      company: job.company,
      description: job.description,
    }))

    // Call Python scoring service
    const response = await fetch(`${SCRAPER_URL}/score-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cv_data: cvData,
        jobs: jobsForScoring,
      }),
    })

    if (!response.ok) {
      // Mark jobs as error
      await ScrapedJob.updateMany(
        { _id: { $in: jobIds } },
        { $set: { scoreStatus: 'error', scoreError: 'Scoring service unavailable' } }
      )

      return NextResponse.json({
        success: false,
        error: 'Scoring service unavailable. Please try again later.',
      }, { status: 503 })
    }

    const data = await response.json()

    // Update each job with its score
    const bulkOps = data.results.map((result: { id: string; score: number }) => ({
      updateOne: {
        filter: { _id: result.id },
        update: {
          $set: {
            compatibilityScore: result.score,
            scoreStatus: 'completed',
            scoreCalculatedAt: new Date(),
            scoreError: null,
          },
        },
      },
    }))

    await ScrapedJob.bulkWrite(bulkOps)

    return NextResponse.json({
      success: true,
      message: `Calculated scores for ${data.results.length} jobs.`,
      processed: data.results.length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to calculate scores'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// GET /api/jobs/calculate-scores - Get scoring status
export async function GET() {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    await connectToDatabase()

    const stats = await ScrapedJob.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(user!.id) } },
      {
        $group: {
          _id: { $ifNull: ['$scoreStatus', 'pending'] },
          count: { $sum: 1 },
        },
      },
    ])

    const statusCounts = {
      pending: 0,
      calculating: 0,
      completed: 0,
      error: 0,
    }

    for (const stat of stats) {
      if (stat._id in statusCounts) {
        statusCounts[stat._id as keyof typeof statusCounts] = stat.count
      }
    }

    return NextResponse.json({
      success: true,
      data: statusCounts,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get scoring status'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
