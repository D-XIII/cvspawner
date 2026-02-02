'use client'

import { Profile, Experience, Formation, Skill } from '@/types'
import { Mail, Phone, MapPin, Linkedin, Github, Globe } from 'lucide-react'
import { CVTemplate, getTemplate } from '@/lib/cv-templates'

interface CVPreviewProps {
  profile: Profile | null
  experiences: Experience[]
  formations: Formation[]
  skills: Skill[]
  templateId?: string
  id?: string
}

export default function CVPreview({
  profile,
  experiences,
  formations,
  skills,
  templateId = 'classic',
  id = 'cv-preview',
}: CVPreviewProps) {
  const template = getTemplate(templateId)
  const colors = template.colors

  const categoryLabels: Record<string, string> = {
    technical: 'Technical Skills',
    soft: 'Soft Skills',
    language: 'Languages',
    tool: 'Tools',
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  const groupedSkills = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = []
    acc[skill.category].push(skill)
    return acc
  }, {} as Record<string, Skill[]>)

  if (!profile && experiences.length === 0 && formations.length === 0 && skills.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted">
        <p>Select items to preview your CV</p>
      </div>
    )
  }

  const fontFamily = template.fontStyle === 'serif'
    ? 'Georgia, "Times New Roman", serif'
    : template.fontStyle === 'modern'
    ? '"Inter", "Segoe UI", system-ui, sans-serif'
    : 'system-ui, -apple-system, sans-serif'

  // Render based on layout type
  if (template.layout === 'sidebar-left') {
    return renderSidebarLayout(template, 'left')
  }

  if (template.layout === 'sidebar-right') {
    return renderSidebarLayout(template, 'right')
  }

  // Classic layout (default)
  return (
    <div
      id={id}
      style={{
        backgroundColor: colors.background,
        color: colors.text,
        width: '210mm',
        minHeight: '297mm',
        maxHeight: '297mm',
        overflow: 'hidden',
        fontSize: '10pt',
        lineHeight: '1.4',
        fontFamily,
      }}
    >
      {/* Header */}
      {profile && renderHeader(template)}

      {/* Content */}
      <div style={{ padding: '24px 32px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {renderExperiences(template)}
          {renderFormations(template)}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {renderSkills(template)}
        </div>
      </div>
    </div>
  )

  function renderSidebarLayout(template: CVTemplate, side: 'left' | 'right') {
    const sidebarContent = (
      <div
        style={{
          width: '70mm',
          minHeight: '297mm',
          backgroundColor: colors.sidebarBg,
          color: colors.sidebarText,
          padding: '32px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Profile info in sidebar */}
        {profile && (
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '4px' }}>
              {profile.firstName}
            </h1>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px' }}>
              {profile.lastName}
            </h1>
            {profile.title && (
              <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>{profile.title}</p>
            )}
          </div>
        )}

        {/* Contact in sidebar */}
        {profile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px', color: colors.accent }}>
              Contact
            </h3>
            {profile.email && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail style={{ width: '12px', height: '12px', color: colors.accent }} />
                {profile.email}
              </span>
            )}
            {profile.phone && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone style={{ width: '12px', height: '12px', color: colors.accent }} />
                {profile.phone}
              </span>
            )}
            {profile.address && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin style={{ width: '12px', height: '12px', color: colors.accent }} />
                {profile.address}
              </span>
            )}
          </div>
        )}

        {/* Skills in sidebar */}
        {renderSkillsSidebar(template)}
      </div>
    )

    const mainContent = (
      <div
        style={{
          flex: 1,
          backgroundColor: colors.background,
          color: colors.text,
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Summary */}
        {profile?.summary && (
          <div>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: colors.primary, marginBottom: '8px' }}>
              Profile
            </h2>
            <p style={{ fontSize: '0.75rem', color: colors.textMuted, lineHeight: '1.6' }}>
              {profile.summary}
            </p>
          </div>
        )}
        {renderExperiences(template)}
        {renderFormations(template)}
      </div>
    )

    return (
      <div
        id={id}
        style={{
          display: 'flex',
          flexDirection: side === 'left' ? 'row' : 'row-reverse',
          width: '210mm',
          minHeight: '297mm',
          maxHeight: '297mm',
          overflow: 'hidden',
          fontSize: '10pt',
          lineHeight: '1.4',
          fontFamily,
        }}
      >
        {sidebarContent}
        {mainContent}
      </div>
    )
  }

  function renderHeader(template: CVTemplate) {
    const isBanner = template.headerStyle === 'banner'
    const isCentered = template.headerStyle === 'centered'

    return (
      <header
        style={{
          background: colors.headerBg,
          color: colors.headerText,
          padding: isBanner ? '32px' : '32px 32px 16px 32px',
          borderBottom: isBanner ? 'none' : `2px solid ${colors.border}`,
          textAlign: isCentered ? 'center' : 'left',
        }}
      >
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>
          {profile!.firstName} {profile!.lastName}
        </h1>
        {profile!.title && (
          <p style={{
            fontSize: '1.125rem',
            marginTop: '4px',
            opacity: isBanner ? 0.9 : 1,
            color: isBanner ? colors.headerText : colors.textMuted,
          }}>
            {profile!.title}
          </p>
        )}

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          marginTop: '12px',
          fontSize: '0.75rem',
          justifyContent: isCentered ? 'center' : 'flex-start',
          opacity: isBanner ? 0.9 : 1,
        }}>
          {profile!.email && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Mail style={{ width: '12px', height: '12px' }} />
              {profile!.email}
            </span>
          )}
          {profile!.phone && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Phone style={{ width: '12px', height: '12px' }} />
              {profile!.phone}
            </span>
          )}
          {profile!.address && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin style={{ width: '12px', height: '12px' }} />
              {profile!.address}
            </span>
          )}
          {profile!.linkedin && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Linkedin style={{ width: '12px', height: '12px' }} />
              LinkedIn
            </span>
          )}
          {profile!.github && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Github style={{ width: '12px', height: '12px' }} />
              GitHub
            </span>
          )}
          {profile!.website && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Globe style={{ width: '12px', height: '12px' }} />
              Website
            </span>
          )}
        </div>

        {profile!.summary && !isBanner && template.layout === 'classic' && (
          <p style={{ marginTop: '12px', fontSize: '0.75rem', color: colors.textMuted, lineHeight: '1.625' }}>
            {profile!.summary}
          </p>
        )}

        {profile!.summary && isBanner && (
          <p style={{ marginTop: '12px', fontSize: '0.75rem', opacity: 0.85, lineHeight: '1.625', maxWidth: '600px', marginLeft: isCentered ? 'auto' : 0, marginRight: isCentered ? 'auto' : 0 }}>
            {profile!.summary}
          </p>
        )}
      </header>
    )
  }

  function renderExperiences(template: CVTemplate) {
    if (experiences.length === 0) return null

    return (
      <section>
        <h2 style={{
          fontSize: '0.875rem',
          fontWeight: 'bold',
          color: colors.primary,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          borderBottom: `2px solid ${colors.primary}`,
          paddingBottom: '4px',
          marginBottom: '12px'
        }}>
          Experience
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {experiences.map((exp) => (
            <div key={exp._id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontWeight: '600', color: colors.text }}>{exp.title}</h3>
                  <p style={{ color: colors.textMuted, fontSize: '0.875rem' }}>
                    {exp.company}{exp.location && ` • ${exp.location}`}
                  </p>
                </div>
                <span style={{ fontSize: '0.75rem', color: colors.textMuted, whiteSpace: 'nowrap', fontStyle: 'italic' }}>
                  {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate!)}
                </span>
              </div>
              <p style={{
                fontSize: '0.75rem',
                color: colors.textMuted,
                marginTop: '4px',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: '1.5',
              }}>
                {exp.description}
              </p>
              {exp.skills.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                  {exp.skills.slice(0, 5).map((skill) => (
                    <span
                      key={skill}
                      style={{
                        fontSize: '0.625rem',
                        padding: '2px 8px',
                        backgroundColor: colors.skillBg,
                        color: colors.skillText,
                        borderRadius: '4px',
                        fontWeight: '500',
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    )
  }

  function renderFormations(template: CVTemplate) {
    if (formations.length === 0) return null

    return (
      <section>
        <h2 style={{
          fontSize: '0.875rem',
          fontWeight: 'bold',
          color: colors.primary,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          borderBottom: `2px solid ${colors.primary}`,
          paddingBottom: '4px',
          marginBottom: '12px'
        }}>
          Education
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {formations.map((form) => (
            <div key={form._id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontWeight: '600', color: colors.text }}>{form.degree}</h3>
                  <p style={{ color: colors.textMuted, fontSize: '0.875rem' }}>
                    {form.school}{form.location && ` • ${form.location}`}
                  </p>
                </div>
                <span style={{ fontSize: '0.75rem', color: colors.textMuted, whiteSpace: 'nowrap', fontStyle: 'italic' }}>
                  {formatDate(form.startDate)} - {form.current ? 'Present' : formatDate(form.endDate!)}
                </span>
              </div>
              {form.description && (
                <p style={{
                  fontSize: '0.75rem',
                  color: colors.textMuted,
                  marginTop: '4px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {form.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    )
  }

  function renderSkills(template: CVTemplate) {
    if (Object.keys(groupedSkills).length === 0) return null

    return (
      <section>
        <h2 style={{
          fontSize: '0.875rem',
          fontWeight: 'bold',
          color: colors.primary,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          borderBottom: `2px solid ${colors.primary}`,
          paddingBottom: '4px',
          marginBottom: '12px'
        }}>
          Skills
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Object.entries(groupedSkills).map(([category, categorySkills]) => (
            <div key={category}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: '600', color: colors.textMuted, marginBottom: '6px' }}>
                {categoryLabels[category] || category}
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {categorySkills.map((skill) => (
                  <span
                    key={skill._id}
                    style={{
                      fontSize: '0.625rem',
                      padding: '3px 8px',
                      backgroundColor: colors.skillBg,
                      color: colors.skillText,
                      borderRadius: '4px',
                      fontWeight: '500',
                    }}
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  function renderSkillsSidebar(template: CVTemplate) {
    if (Object.keys(groupedSkills).length === 0) return null

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {Object.entries(groupedSkills).map(([category, categorySkills]) => (
          <div key={category}>
            <h3 style={{
              fontSize: '0.75rem',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '8px',
              color: colors.accent,
            }}>
              {categoryLabels[category] || category}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {categorySkills.map((skill) => (
                <span
                  key={skill._id}
                  style={{
                    fontSize: '0.75rem',
                    padding: '4px 0',
                    borderBottom: `1px solid ${colors.border}`,
                  }}
                >
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }
}
