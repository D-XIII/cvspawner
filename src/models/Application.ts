import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface IApplication extends Document {
  userId: Types.ObjectId
  jobId?: Types.ObjectId
  company: string
  position: string
  location?: string
  url?: string
  status: 'draft' | 'sent' | 'followed_up' | 'interview' | 'rejected' | 'accepted'
  appliedAt?: Date | null
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const ApplicationSchema = new Schema<IApplication>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'ScrapedJob', index: true },
    company: { type: String, required: true, trim: true },
    position: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    url: { type: String, trim: true },
    status: {
      type: String,
      enum: ['draft', 'sent', 'followed_up', 'interview', 'rejected', 'accepted'],
      default: 'draft',
    },
    appliedAt: { type: Date, default: null },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
)

// Ensure only one application per job per user
ApplicationSchema.index(
  { userId: 1, jobId: 1 },
  { unique: true, partialFilterExpression: { jobId: { $exists: true, $ne: null } } }
)

const Application: Model<IApplication> =
  mongoose.models.Application || mongoose.model<IApplication>('Application', ApplicationSchema)

export default Application
