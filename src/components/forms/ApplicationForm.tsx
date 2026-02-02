'use client'

import { useState, FormEvent } from 'react'
import { Input, Select, Textarea } from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Application, ApplicationStatus } from '@/types'

interface ApplicationFormProps {
  application?: Application
  onSubmit: (data: Partial<Application>) => Promise<void>
  onCancel: () => void
}

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'followed_up', label: 'Followed Up' },
  { value: 'interview', label: 'Interview' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'accepted', label: 'Accepted' },
]

export default function ApplicationForm({ application, onSubmit, onCancel }: ApplicationFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    company: application?.company || '',
    position: application?.position || '',
    location: application?.location || '',
    url: application?.url || '',
    status: application?.status || 'draft' as ApplicationStatus,
    appliedAt: application?.appliedAt
      ? new Date(application.appliedAt).toISOString().split('T')[0]
      : '',
    notes: application?.notes || '',
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        ...formData,
        appliedAt: formData.appliedAt || null,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Company"
          value={formData.company}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          placeholder="Google, Microsoft..."
          required
        />
        <Input
          label="Position"
          value={formData.position}
          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
          placeholder="DevOps Engineer..."
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="Zurich, Geneva..."
        />
        <Input
          label="Job URL"
          type="url"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          placeholder="https://..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as ApplicationStatus })}
          options={statusOptions}
        />
        <Input
          label="Applied Date"
          type="date"
          value={formData.appliedAt}
          onChange={(e) => setFormData({ ...formData, appliedAt: e.target.value })}
        />
      </div>

      <Textarea
        label="Notes"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        placeholder="Contact person, salary discussed, feedback..."
        rows={4}
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {application ? 'Update' : 'Create'} Application
        </Button>
      </div>
    </form>
  )
}
