'use client'

import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Linkedin, Github } from 'lucide-react'
import { demoProfile, demoExperiences, demoFormations, demoSkills } from '@/data/demo-data'

// Modern template colors for the demo
const colors = {
  primary: '#7c3aed',
  headerBg: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
  headerText: '#ffffff',
  background: '#ffffff',
  text: '#1f2937',
  textMuted: '#6b7280',
  border: '#e5e7eb',
  skillBg: '#ede9fe',
  skillText: '#5b21b6',
}

export default function DemoCV() {
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  const groupedSkills = demoSkills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = []
    acc[skill.category].push(skill)
    return acc
  }, {} as Record<string, typeof demoSkills>)

  const categoryLabels: Record<string, string> = {
    technical: 'Technical',
    soft: 'Soft Skills',
    language: 'Languages',
    tool: 'Tools',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotateX: 10 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="relative"
      style={{ perspective: '1000px' }}
    >
      {/* Glow effect behind */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-indigo-500/20 blur-3xl rounded-3xl" />

      {/* CV Container */}
      <motion.div
        whileHover={{ scale: 1.02, rotateY: 2 }}
        transition={{ duration: 0.3 }}
        className="relative rounded-xl shadow-2xl overflow-hidden"
        style={{
          width: '100%',
          maxWidth: '400px',
          aspectRatio: '210 / 297',
          backgroundColor: colors.background,
        }}
      >
        {/* Scaled CV Content */}
        <div
          className="origin-top-left"
          style={{
            transform: 'scale(0.48)',
            width: '210%',
            height: '210%',
            color: colors.text,
          }}
        >
          {/* Modern Header with gradient */}
          <header
            style={{
              background: colors.headerBg,
              color: colors.headerText,
              padding: '24px',
            }}
          >
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {demoProfile.firstName} {demoProfile.lastName}
            </h1>
            <p style={{ fontSize: '1rem', marginTop: '4px', opacity: 0.9 }}>
              {demoProfile.title}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '12px', fontSize: '0.7rem', opacity: 0.9 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Mail style={{ width: '10px', height: '10px' }} />
                {demoProfile.email}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Phone style={{ width: '10px', height: '10px' }} />
                {demoProfile.phone}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin style={{ width: '10px', height: '10px' }} />
                {demoProfile.address}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Linkedin style={{ width: '10px', height: '10px' }} />
                LinkedIn
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Github style={{ width: '10px', height: '10px' }} />
                GitHub
              </span>
            </div>

            <p style={{ marginTop: '10px', fontSize: '0.7rem', opacity: 0.85, lineHeight: '1.5' }}>
              {demoProfile.summary}
            </p>
          </header>

          {/* Content */}
          <div style={{ padding: '16px 24px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            {/* Main content - 2/3 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Experiences */}
              <section>
                <h2 style={{
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  color: colors.primary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: `2px solid ${colors.primary}`,
                  paddingBottom: '4px',
                  marginBottom: '10px'
                }}>
                  Experience
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {demoExperiences.slice(0, 2).map((exp) => (
                    <div key={exp._id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ fontWeight: '600', color: colors.text, fontSize: '0.85rem' }}>{exp.title}</h3>
                          <p style={{ color: colors.textMuted, fontSize: '0.7rem' }}>{exp.company} • {exp.location}</p>
                        </div>
                        <span style={{ fontSize: '0.65rem', color: colors.textMuted, whiteSpace: 'nowrap', fontStyle: 'italic' }}>
                          {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate!)}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.65rem', color: colors.textMuted, marginTop: '4px', lineHeight: '1.4' }}>
                        {exp.description?.slice(0, 120)}...
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '4px' }}>
                        {exp.skills.slice(0, 4).map((skill) => (
                          <span key={skill} style={{
                            fontSize: '0.55rem',
                            padding: '2px 6px',
                            backgroundColor: colors.skillBg,
                            color: colors.skillText,
                            borderRadius: '3px',
                            fontWeight: '500',
                          }}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Education */}
              <section>
                <h2 style={{
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  color: colors.primary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: `2px solid ${colors.primary}`,
                  paddingBottom: '4px',
                  marginBottom: '10px'
                }}>
                  Education
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {demoFormations.map((form) => (
                    <div key={form._id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ fontWeight: '600', color: colors.text, fontSize: '0.8rem' }}>{form.degree}</h3>
                          <p style={{ color: colors.textMuted, fontSize: '0.7rem' }}>{form.school}</p>
                        </div>
                        <span style={{ fontSize: '0.65rem', color: colors.textMuted, whiteSpace: 'nowrap', fontStyle: 'italic' }}>
                          {formatDate(form.startDate)} - {formatDate(form.endDate!)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar - 1/3 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <section>
                <h2 style={{
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  color: colors.primary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: `2px solid ${colors.primary}`,
                  paddingBottom: '4px',
                  marginBottom: '10px'
                }}>
                  Skills
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {Object.entries(groupedSkills).slice(0, 3).map(([category, skills]) => (
                    <div key={category}>
                      <h3 style={{ fontSize: '0.65rem', fontWeight: '600', color: colors.textMuted, marginBottom: '4px' }}>
                        {categoryLabels[category]}
                      </h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                        {skills.slice(0, 4).map((skill) => (
                          <span
                            key={skill._id}
                            style={{
                              fontSize: '0.55rem',
                              padding: '2px 6px',
                              backgroundColor: colors.skillBg,
                              color: colors.skillText,
                              borderRadius: '3px',
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
            </div>
          </div>
        </div>

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
      </motion.div>

      {/* Label */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
        className="text-center mt-4"
      >
        <span className="text-sm text-muted">Generated CV Preview</span>
      </motion.div>
    </motion.div>
  )
}
