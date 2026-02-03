import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export type ScoreStatus = 'pending' | 'calculating' | 'completed' | 'error'

export interface IScrapedJob extends Document {
  userId: Types.ObjectId
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
  savedAt: Date
  // Compatibility score fields
  compatibilityScore?: number
  scoreStatus: ScoreStatus
  scoreCalculatedAt?: Date
  scoreError?: string
  createdAt: Date
  updatedAt: Date
}

const ScrapedJobSchema = new Schema<IScrapedJob>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    jobUrl: { type: String, trim: true },
    description: { type: String, trim: true },
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    salaryCurrency: { type: String, trim: true },
    datePosted: { type: String, trim: true },
    jobType: { type: String, trim: true },
    isRemote: { type: Boolean, default: false },
    site: { type: String, required: true, trim: true },
    savedAt: { type: Date, default: Date.now },
    // Compatibility score fields
    compatibilityScore: { type: Number, min: 0, max: 100 },
    scoreStatus: {
      type: String,
      enum: ['pending', 'calculating', 'completed', 'error'],
      default: 'pending'
    },
    scoreCalculatedAt: { type: Date },
    scoreError: { type: String },
  },
  { timestamps: true }
)

// Compound index for efficient queries
ScrapedJobSchema.index({ userId: 1, company: 1, title: 1 })
ScrapedJobSchema.index({ userId: 1, savedAt: -1 })
// Index for finding jobs needing score calculation
ScrapedJobSchema.index({ userId: 1, scoreStatus: 1 })

const ScrapedJob: Model<IScrapedJob> =
  mongoose.models.ScrapedJob || mongoose.model<IScrapedJob>('ScrapedJob', ScrapedJobSchema)

export default ScrapedJob
