'use client'

import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Linkedin, Github } from 'lucide-react'
import { demoProfile, demoExperiences, demoFormations, demoSkills } from '@/data/demo-data'

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
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 blur-3xl rounded-3xl" />

      {/* CV Container */}
      <motion.div
        whileHover={{ scale: 1.02, rotateY: 2 }}
        transition={{ duration: 0.3 }}
        className="relative bg-white rounded-xl shadow-2xl overflow-hidden"
        style={{
          width: '100%',
          maxWidth: '400px',
          aspectRatio: '210 / 297',
        }}
      >
        {/* Scaled CV Content */}
        <div
          className="origin-top-left p-4 text-gray-900"
          style={{
            transform: 'scale(0.48)',
            width: '210%',
            height: '210%',
          }}
        >
          {/* Header */}
          <header className="border-b-2 border-gray-800 pb-3 mb-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {demoProfile.firstName} {demoProfile.lastName}
            </h1>
            <p className="text-lg text-gray-600">{demoProfile.title}</p>

            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {demoProfile.email}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {demoProfile.phone}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {demoProfile.address}
              </span>
              <span className="flex items-center gap-1">
                <Linkedin className="w-3 h-3" />
                LinkedIn
              </span>
              <span className="flex items-center gap-1">
                <Github className="w-3 h-3" />
                GitHub
              </span>
            </div>

            <p className="mt-2 text-xs text-gray-700 leading-relaxed">
              {demoProfile.summary}
            </p>
          </header>

          <div className="grid grid-cols-3 gap-4">
            {/* Main content - 2/3 */}
            <div className="col-span-2 space-y-3">
              {/* Experiences */}
              <section>
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-300 pb-1 mb-2">
                  Experience
                </h2>
                <div className="space-y-2">
                  {demoExperiences.slice(0, 2).map((exp) => (
                    <div key={exp._id}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">{exp.title}</h3>
                          <p className="text-gray-600 text-xs">{exp.company} • {exp.location}</p>
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate!)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 mt-1 line-clamp-2">{exp.description}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {exp.skills.slice(0, 4).map((skill) => (
                          <span key={skill} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
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
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-300 pb-1 mb-2">
                  Education
                </h2>
                <div className="space-y-2">
                  {demoFormations.map((form) => (
                    <div key={form._id}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">{form.degree}</h3>
                          <p className="text-gray-600 text-xs">{form.school}</p>
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(form.startDate)} - {formatDate(form.endDate!)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar - 1/3 */}
            <div className="space-y-3">
              <section>
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-300 pb-1 mb-2">
                  Skills
                </h2>
                <div className="space-y-2">
                  {Object.entries(groupedSkills).slice(0, 3).map(([category, skills]) => (
                    <div key={category}>
                      <h3 className="text-xs font-semibold text-gray-700 mb-1">
                        {categoryLabels[category]}
                      </h3>
                      <div className="flex flex-wrap gap-1">
                        {skills.slice(0, 4).map((skill) => (
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
            </div>
          </div>
        </div>

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />
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
