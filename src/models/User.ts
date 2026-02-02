import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
  email: string
  password?: string
  name?: string
  image?: string
  emailVerified?: Date
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false,
    },
    name: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
    },
    emailVerified: {
      type: Date,
    },
  },
  { timestamps: true }
)

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
