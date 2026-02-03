import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import ScrapedJob from '@/models/ScrapedJob'

const CLEANUP_DAYS = 7

// POST /api/jobs/cleanup - Delete scraped jobs older than 7 days that haven't been applied
// This can be called by a cron job or manually
export async function POST() {
  try {
    await connectToDatabase()

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_DAYS)

    // Delete jobs that:
    // 1. Have status 'scraped' (not saved or applied)
    // 2. Were scraped more than 7 days ago
    const result = await ScrapedJob.deleteMany({
      status: 'scraped',
      scrapedAt: { $lt: cutoffDate },
    })

    return NextResponse.json({
      success: true,
      deleted: result.deletedCount,
      message: `Deleted ${result.deletedCount} scraped jobs older than ${CLEANUP_DAYS} days`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Cleanup failed'
    console.error('Cleanup error:', error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
