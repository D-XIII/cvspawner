'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Experience, Formation, Skill } from '@/types'

interface CVSelectorProps {
  experiences: Experience[]
  formations: Formation[]
  skills: Skill[]
  selectedExperiences: string[]
  selectedFormations: string[]
  selectedSkills: string[]
  onToggleExperience: (id: string) => void
  onToggleFormation: (id: string) => void
  onToggleSkill: (id: string) => void
}

export default function CVSelector({
  experiences,
  formations,
  skills,
  selectedExperiences,
  selectedFormations,
  selectedSkills,
  onToggleExperience,
  onToggleFormation,
  onToggleSkill,
}: CVSelectorProps) {
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-6">
      {/* Experiences */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Experiences</h3>
        <div className="space-y-2">
          {experiences.length === 0 ? (
            <p className="text-muted text-sm">No experiences added yet.</p>
          ) : (
            experiences.map((exp) => (
              <SelectableItem
                key={exp._id}
                selected={selectedExperiences.includes(exp._id!)}
                onToggle={() => onToggleExperience(exp._id!)}
              >
                <div className="flex-1">
                  <div className="font-medium text-foreground">{exp.title}</div>
                  <div className="text-sm text-muted">
                    {exp.company} • {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate!)}
                  </div>
                </div>
              </SelectableItem>
            ))
          )}
        </div>
      </div>

      {/* Formations */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Formations</h3>
        <div className="space-y-2">
          {formations.length === 0 ? (
            <p className="text-muted text-sm">No formations added yet.</p>
          ) : (
            formations.map((form) => (
              <SelectableItem
                key={form._id}
                selected={selectedFormations.includes(form._id!)}
                onToggle={() => onToggleFormation(form._id!)}
              >
                <div className="flex-1">
                  <div className="font-medium text-foreground">{form.degree}</div>
                  <div className="text-sm text-muted">
                    {form.school} • {formatDate(form.startDate)} - {form.current ? 'Present' : formatDate(form.endDate!)}
                  </div>
                </div>
              </SelectableItem>
            ))
          )}
        </div>
      </div>

      {/* Skills */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Skills</h3>
        <div className="flex flex-wrap gap-2">
          {skills.length === 0 ? (
            <p className="text-muted text-sm">No skills added yet.</p>
          ) : (
            skills.map((skill) => (
              <button
                key={skill._id}
                onClick={() => onToggleSkill(skill._id!)}
                className={`
                  px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                  ${selectedSkills.includes(skill._id!)
                    ? 'bg-primary text-white'
                    : 'bg-card border border-border text-muted hover:text-foreground hover:border-primary/50'
                  }
                `}
              >
                {skill.name}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

interface SelectableItemProps {
  selected: boolean
  onToggle: () => void
  children: React.ReactNode
}

function SelectableItem({ selected, onToggle, children }: SelectableItemProps) {
  return (
    <motion.button
      onClick={onToggle}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`
        w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200
        ${selected
          ? 'bg-primary/10 border border-primary/50'
          : 'bg-card border border-border hover:border-primary/30'
        }
      `}
    >
      <div className={`
        w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors
        ${selected ? 'bg-primary' : 'bg-card-hover border border-border'}
      `}>
        {selected && <Check className="w-3 h-3 text-white" />}
      </div>
      {children}
    </motion.button>
  )
}
