import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export interface ISettings extends Document {
  userId: Types.ObjectId
  provider: 'claude' | 'openai' | 'gemini'
  encryptedApiKey: string
  isConfigured: boolean
  createdAt: Date
  updatedAt: Date
}

const SettingsSchema = new Schema<ISettings>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ['claude', 'openai', 'gemini'],
      required: true,
    },
    encryptedApiKey: {
      type: String,
      required: true,
    },
    isConfigured: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

const Settings: Model<ISettings> =
  mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema)

export default Settings
