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

// Using inline styles with hex colors for html2canvas compatibility
// (Tailwind v4 uses lab() colors which html2canvas doesn't support)
const colors = {
  white: '#ffffff',
  gray900: '#111827',
  gray800: '#1f2937',
  gray700: '#374151',
  gray600: '#4b5563',
  gray500: '#6b7280',
  gray300: '#d1d5db',
  gray100: '#f3f4f6',
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
      style={{
        backgroundColor: colors.white,
        color: colors.gray900,
        padding: '32px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
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
        <header style={{ borderBottom: `2px solid ${colors.gray800}`, paddingBottom: '16px', marginBottom: '16px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: colors.gray900 }}>
            {profile.firstName} {profile.lastName}
          </h1>
          {profile.title && (
            <p style={{ fontSize: '1.125rem', color: colors.gray600, marginTop: '4px' }}>{profile.title}</p>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '12px', fontSize: '0.75rem', color: colors.gray600 }}>
            {profile.email && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Mail style={{ width: '12px', height: '12px' }} />
                {profile.email}
              </span>
            )}
            {profile.phone && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Phone style={{ width: '12px', height: '12px' }} />
                {profile.phone}
              </span>
            )}
            {profile.address && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin style={{ width: '12px', height: '12px' }} />
                {profile.address}
              </span>
            )}
            {profile.linkedin && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Linkedin style={{ width: '12px', height: '12px' }} />
                LinkedIn
              </span>
            )}
            {profile.github && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Github style={{ width: '12px', height: '12px' }} />
                GitHub
              </span>
            )}
            {profile.website && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Globe style={{ width: '12px', height: '12px' }} />
                Website
              </span>
            )}
          </div>

          {profile.summary && (
            <p style={{ marginTop: '12px', fontSize: '0.75rem', color: colors.gray700, lineHeight: '1.625' }}>
              {profile.summary}
            </p>
          )}
        </header>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Main content - 2/3 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Experiences */}
          {experiences.length > 0 && (
            <section>
              <h2 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: colors.gray900, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${colors.gray300}`, paddingBottom: '4px', marginBottom: '12px' }}>
                Experience
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {experiences.map((exp) => (
                  <div key={exp._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ fontWeight: '600', color: colors.gray900 }}>{exp.title}</h3>
                        <p style={{ color: colors.gray600 }}>{exp.company}{exp.location && ` • ${exp.location}`}</p>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: colors.gray500, whiteSpace: 'nowrap' }}>
                        {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate!)}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: colors.gray700, marginTop: '4px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{exp.description}</p>
                    {exp.skills.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                        {exp.skills.slice(0, 5).map((skill) => (
                          <span key={skill} style={{ fontSize: '0.75rem', padding: '2px 6px', backgroundColor: colors.gray100, color: colors.gray600, borderRadius: '4px' }}>
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
              <h2 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: colors.gray900, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${colors.gray300}`, paddingBottom: '4px', marginBottom: '12px' }}>
                Education
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {formations.map((form) => (
                  <div key={form._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ fontWeight: '600', color: colors.gray900 }}>{form.degree}</h3>
                        <p style={{ color: colors.gray600 }}>{form.school}{form.location && ` • ${form.location}`}</p>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: colors.gray500, whiteSpace: 'nowrap' }}>
                        {formatDate(form.startDate)} - {form.current ? 'Present' : formatDate(form.endDate!)}
                      </span>
                    </div>
                    {form.description && (
                      <p style={{ fontSize: '0.75rem', color: colors.gray700, marginTop: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{form.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar - 1/3 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Skills */}
          {Object.keys(groupedSkills).length > 0 && (
            <section>
              <h2 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: colors.gray900, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${colors.gray300}`, paddingBottom: '4px', marginBottom: '12px' }}>
                Skills
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(groupedSkills).map(([category, categorySkills]) => (
                  <div key={category}>
                    <h3 style={{ fontSize: '0.75rem', fontWeight: '600', color: colors.gray700, marginBottom: '4px' }}>
                      {categoryLabels[category] || category}
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {categorySkills.map((skill) => (
                        <span
                          key={skill._id}
                          style={{ fontSize: '0.75rem', padding: '2px 6px', backgroundColor: colors.gray100, color: colors.gray700, borderRadius: '4px' }}
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
