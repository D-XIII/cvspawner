'use client'

import { useState, FormEvent } from 'react'
import { Input, Textarea } from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Experience } from '@/types'
import { X } from 'lucide-react'

interface ExperienceFormProps {
  experience?: Experience
  onSubmit: (data: Partial<Experience>) => Promise<void>
  onCancel: () => void
}

export default function ExperienceForm({ experience, onSubmit, onCancel }: ExperienceFormProps) {
  const [loading, setLoading] = useState(false)
  const [skillInput, setSkillInput] = useState('')
  const [formData, setFormData] = useState({
    title: experience?.title || '',
    company: experience?.company || '',
    location: experience?.location || '',
    startDate: experience?.startDate ? new Date(experience.startDate).toISOString().split('T')[0] : '',
    endDate: experience?.endDate ? new Date(experience.endDate).toISOString().split('T')[0] : '',
    current: experience?.current || false,
    description: experience?.description || '',
    skills: experience?.skills || [] as string[],
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

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, skillInput.trim()] })
      setSkillInput('')
    }
  }

  const removeSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Job Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Software Engineer"
          required
        />
        <Input
          label="Company"
          value={formData.company}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          placeholder="Tech Corp"
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
        <span className="text-sm text-foreground">I currently work here</span>
      </label>

      <Textarea
        label="Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Describe your responsibilities and achievements..."
        required
      />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">Skills</label>
        <div className="flex gap-2">
          <Input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            placeholder="Add a skill"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addSkill()
              }
            }}
          />
          <Button type="button" variant="secondary" onClick={addSkill}>
            Add
          </Button>
        </div>
        {formData.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="hover:text-error transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {experience ? 'Update' : 'Create'} Experience
        </Button>
      </div>
    </form>
  )
}
