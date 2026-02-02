import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IApplication extends Document {
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

const Application: Model<IApplication> =
  mongoose.models.Application || mongoose.model<IApplication>('Application', ApplicationSchema)

export default Application
