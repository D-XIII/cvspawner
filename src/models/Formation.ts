import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface IFormation extends Document {
  userId: Types.ObjectId
  degree: string
  school: string
  location?: string
  startDate: Date
  endDate?: Date | null
  current: boolean
  description?: string
  createdAt: Date
  updatedAt: Date
}

const FormationSchema = new Schema<IFormation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    degree: { type: String, required: true, trim: true },
    school: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    current: { type: Boolean, default: false },
    description: { type: String, trim: true },
  },
  { timestamps: true }
)

const Formation: Model<IFormation> =
  mongoose.models.Formation || mongoose.model<IFormation>('Formation', FormationSchema)

export default Formation
