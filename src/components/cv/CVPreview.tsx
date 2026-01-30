'use client'

import { Profile, Experience, Formation, Skill } from '@/types'
import { Mail, Phone, MapPin, Linkedin, Github, Globe } from 'lucide-react'

interface CVPreviewProps {
  profile: Profile | null
  experiences: Experience[]
  formations: Formation[]
  skills: Skill[]
  id?: string
}

export default function CVPreview({ profile, experiences, formations, skills, id = 'cv-preview' }: CVPreviewProps) {
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
  }

  const groupedSkills = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = []
    acc[skill.category].push(skill)
    return acc
  }, {} as Record<string, Skill[]>)

  const categoryLabels: Record<string, string> = {
    technical: 'Technical Skills',
    soft: 'Soft Skills',
    language: 'Languages',
    tool: 'Tools',
  }

  if (!profile && experiences.length === 0 && formations.length === 0 && skills.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted">
        <p>Select items to preview your CV</p>
      </div>
    )
  }

  return (
    <div
      id={id}
      className="bg-white text-gray-900 p-8 shadow-lg"
      style={{
        width: '210mm',
        minHeight: '297mm',
        maxHeight: '297mm',
        overflow: 'hidden',
        fontSize: '10pt',
        lineHeight: '1.4',
      }}
    >
      {/* Header */}
      {profile && (
        <header className="border-b-2 border-gray-800 pb-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {profile.firstName} {profile.lastName}
          </h1>
          {profile.title && (
            <p className="text-lg text-gray-600 mt-1">{profile.title}</p>
          )}

          <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-600">
            {profile.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {profile.email}
              </span>
            )}
            {profile.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {profile.phone}
              </span>
            )}
            {profile.address && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {profile.address}
              </span>
            )}
            {profile.linkedin && (
              <span className="flex items-center gap-1">
                <Linkedin className="w-3 h-3" />
                LinkedIn
              </span>
            )}
            {profile.github && (
              <span className="flex items-center gap-1">
                <Github className="w-3 h-3" />
                GitHub
              </span>
            )}
            {profile.website && (
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Website
              </span>
            )}
          </div>

          {profile.summary && (
            <p className="mt-3 text-xs text-gray-700 leading-relaxed">
              {profile.summary}
            </p>
          )}
        </header>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Main content - 2/3 */}
        <div className="col-span-2 space-y-4">
          {/* Experiences */}
          {experiences.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">
                Experience
              </h2>
              <div className="space-y-3">
                {experiences.map((exp) => (
                  <div key={exp._id}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{exp.title}</h3>
                        <p className="text-gray-600">{exp.company}{exp.location && ` • ${exp.location}`}</p>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate!)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 mt-1 line-clamp-3">{exp.description}</p>
                    {exp.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {exp.skills.slice(0, 5).map((skill) => (
                          <span key={skill} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Formations */}
          {formations.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">
                Education
              </h2>
              <div className="space-y-2">
                {formations.map((form) => (
                  <div key={form._id}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{form.degree}</h3>
                        <p className="text-gray-600">{form.school}{form.location && ` • ${form.location}`}</p>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(form.startDate)} - {form.current ? 'Present' : formatDate(form.endDate!)}
                      </span>
                    </div>
                    {form.description && (
                      <p className="text-xs text-gray-700 mt-1 line-clamp-2">{form.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar - 1/3 */}
        <div className="space-y-4">
          {/* Skills */}
          {Object.keys(groupedSkills).length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">
                Skills
              </h2>
              <div className="space-y-3">
                {Object.entries(groupedSkills).map(([category, categorySkills]) => (
                  <div key={category}>
                    <h3 className="text-xs font-semibold text-gray-700 mb-1">
                      {categoryLabels[category] || category}
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {categorySkills.map((skill) => (
                        <span
                          key={skill._id}
                          className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded"
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
