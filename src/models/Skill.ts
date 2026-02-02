import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface ISkill extends Document {
  userId: Types.ObjectId
  name: string
  category: 'technical' | 'soft' | 'language' | 'tool'
  level: 1 | 2 | 3 | 4 | 5
  createdAt: Date
  updatedAt: Date
}

const SkillSchema = new Schema<ISkill>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['technical', 'soft', 'language', 'tool'],
    },
    level: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  { timestamps: true }
)

const Skill: Model<ISkill> =
  mongoose.models.Skill || mongoose.model<ISkill>('Skill', SkillSchema)

export default Skill
