'use client'

import { useState, FormEvent } from 'react'
import { Input, Textarea } from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Profile } from '@/types'

interface ProfileFormProps {
  profile?: Profile | null
  onSubmit: (data: Partial<Profile>) => Promise<void>
}

export default function ProfileForm({ profile, onSubmit }: ProfileFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    title: profile?.title || '',
    summary: profile?.summary || '',
    linkedin: profile?.linkedin || '',
    github: profile?.github || '',
    website: profile?.website || '',
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(formData)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="First Name"
          value={formData.firstName}
          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          placeholder="John"
          required
        />
        <Input
          label="Last Name"
          value={formData.lastName}
          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          placeholder="Doe"
          required
        />
      </div>

      <Input
        label="Professional Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Full Stack Developer"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="john.doe@example.com"
          required
        />
        <Input
          label="Phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+33 6 12 34 56 78"
        />
      </div>

      <Input
        label="Address"
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        placeholder="Paris, France"
      />

      <Textarea
        label="Professional Summary"
        value={formData.summary}
        onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
        placeholder="A brief summary of your professional background and career objectives..."
      />

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Social Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="LinkedIn"
            value={formData.linkedin}
            onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
            placeholder="https://linkedin.com/in/..."
          />
          <Input
            label="GitHub"
            value={formData.github}
            onChange={(e) => setFormData({ ...formData, github: e.target.value })}
            placeholder="https://github.com/..."
          />
          <Input
            label="Website"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://yoursite.com"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" loading={loading}>
          {profile ? 'Update' : 'Save'} Profile
        </Button>
      </div>
    </form>
  )
}
