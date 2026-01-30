'use client'

import { useState, FormEvent } from 'react'
import { Input, Select } from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Skill } from '@/types'

interface SkillFormProps {
  skill?: Skill
  onSubmit: (data: Partial<Skill>) => Promise<void>
  onCancel: () => void
}

const categoryOptions = [
  { value: 'technical', label: 'Technical' },
  { value: 'soft', label: 'Soft Skill' },
  { value: 'language', label: 'Language' },
  { value: 'tool', label: 'Tool' },
]

const levelOptions = [
  { value: '1', label: '1 - Beginner' },
  { value: '2', label: '2 - Elementary' },
  { value: '3', label: '3 - Intermediate' },
  { value: '4', label: '4 - Advanced' },
  { value: '5', label: '5 - Expert' },
]

export default function SkillForm({ skill, onSubmit, onCancel }: SkillFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: skill?.name || '',
    category: skill?.category || 'technical',
    level: skill?.level || 3,
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Skill Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="React, Python, Leadership..."
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Category"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value as Skill['category'] })}
          options={categoryOptions}
          required
        />

        <Select
          label="Level"
          value={String(formData.level)}
          onChange={(e) => setFormData({ ...formData, level: Number(e.target.value) as Skill['level'] })}
          options={levelOptions}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">Level Preview</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setFormData({ ...formData, level: level as Skill['level'] })}
              aria-label={`Set level to ${level}`}
              className={`h-3 w-full rounded-full transition-all cursor-pointer hover:scale-110 ${
                level <= formData.level ? 'bg-primary hover:bg-primary/80' : 'bg-border hover:bg-primary/40'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {skill ? 'Update' : 'Create'} Skill
        </Button>
      </div>
    </form>
  )
}
