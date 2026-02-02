'use client'

import { useState, FormEvent } from 'react'
import { Input, Textarea } from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Formation } from '@/types'

interface FormationFormProps {
  formation?: Formation
  onSubmit: (data: Partial<Formation>) => Promise<void>
  onCancel: () => void
}

export default function FormationForm({ formation, onSubmit, onCancel }: FormationFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    degree: formation?.degree || '',
    school: formation?.school || '',
    location: formation?.location || '',
    startDate: formation?.startDate ? new Date(formation.startDate).toISOString().split('T')[0] : '',
    endDate: formation?.endDate ? new Date(formation.endDate).toISOString().split('T')[0] : '',
    current: formation?.current || false,
    description: formation?.description || '',
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        ...formData,
        endDate: formData.current ? null : formData.endDate || null,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Degree / Diploma"
          value={formData.degree}
          onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
          placeholder="Master in Computer Science"
          required
        />
        <Input
          label="School / University"
          value={formData.school}
          onChange={(e) => setFormData({ ...formData, school: e.target.value })}
          placeholder="University of Paris"
          required
        />
      </div>

      <Input
        label="Location"
        value={formData.location}
        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        placeholder="Paris, France"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Start Date"
          type="date"
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          required
        />
        <Input
          label="End Date"
          type="date"
          value={formData.endDate}
          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          disabled={formData.current}
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.current}
          onChange={(e) => setFormData({ ...formData, current: e.target.checked, endDate: '' })}
          className="w-4 h-4 rounded border-border bg-card text-primary focus:ring-primary"
        />
        <span className="text-sm text-foreground">I am currently studying here</span>
      </label>

      <Textarea
        label="Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Describe your studies, achievements, thesis..."
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {formation ? 'Update' : 'Create'} Formation
        </Button>
      </div>
    </form>
  )
}
