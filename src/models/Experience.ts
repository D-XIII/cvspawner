import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface IExperience extends Document {
  userId: Types.ObjectId
  title: string
  company: string
  location?: string
  startDate: Date
  endDate?: Date | null
  current: boolean
  description: string
  skills: string[]
  createdAt: Date
  updatedAt: Date
}

const ExperienceSchema = new Schema<IExperience>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    current: { type: Boolean, default: false },
    description: { type: String, required: true },
    skills: [{ type: String, trim: true }],
  },
  { timestamps: true }
)

const Experience: Model<IExperience> =
  mongoose.models.Experience || mongoose.model<IExperience>('Experience', ExperienceSchema)

export default Experience
