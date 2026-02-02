'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { User, Loader2 } from 'lucide-react'
import Card from '@/components/ui/Card'
import ProfileForm from '@/components/forms/ProfileForm'
import { Profile } from '@/types'

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile')
      const data = await res.json()
      if (data.success) {
        setProfile(data.data)
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to fetch profile' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (formData: Partial<Profile>) => {
    try {
      const method = profile ? 'PUT' : 'POST'
      const res = await fetch('/api/profile', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()

      if (data.success) {
        setProfile(data.data)
        setMessage({ type: 'success', text: 'Profile saved successfully!' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save profile' })
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        </div>
        <p className="text-muted">
          Manage your personal information that will appear on your CV.
        </p>
      </motion.div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-success/10 border border-success/20 text-success'
              : 'bg-error/10 border border-error/20 text-error'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <ProfileForm profile={profile} onSubmit={handleSubmit} />
        </Card>
      )}
    </div>
  )
}
