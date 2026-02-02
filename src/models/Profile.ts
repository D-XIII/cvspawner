import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface IProfile extends Document {
  userId: Types.ObjectId
  firstName: string
  lastName: string
  email: string
  phone?: string
  address?: string
  title?: string
  summary?: string
  linkedin?: string
  github?: string
  website?: string
  createdAt: Date
  updatedAt: Date
}

const ProfileSchema = new Schema<IProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
    },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    title: { type: String, trim: true },
    summary: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    github: { type: String, trim: true },
    website: { type: String, trim: true },
  },
  { timestamps: true }
)

const Profile: Model<IProfile> =
  mongoose.models.Profile || mongoose.model<IProfile>('Profile', ProfileSchema)

export default Profile
