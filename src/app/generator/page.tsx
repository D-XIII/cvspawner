'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Loader2, Eye, EyeOff, Palette } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import CVSelector from '@/components/cv/CVSelector'
import CVPreview from '@/components/cv/CVPreview'
import TemplateSelector from '@/components/cv/TemplateSelector'
import { generatePDF } from '@/lib/pdf-generator'
import { Profile, Experience, Formation, Skill } from '@/types'

export default function GeneratorPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [formations, setFormations] = useState<Formation[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('modern')

  const [selectedExperiences, setSelectedExperiences] = useState<string[]>([])
  const [selectedFormations, setSelectedFormations] = useState<string[]>([])
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      const [profileRes, experiencesRes, formationsRes, skillsRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/experiences'),
        fetch('/api/formations'),
        fetch('/api/skills'),
      ])

      const [profileData, experiencesData, formationsData, skillsData] = await Promise.all([
        profileRes.json(),
        experiencesRes.json(),
        formationsRes.json(),
        skillsRes.json(),
      ])

      if (profileData.success) setProfile(profileData.data)
      if (experiencesData.success) {
        setExperiences(experiencesData.data)
        setSelectedExperiences(experiencesData.data.map((e: Experience) => e._id!))
      }
      if (formationsData.success) {
        setFormations(formationsData.data)
        setSelectedFormations(formationsData.data.map((f: Formation) => f._id!))
      }
      if (skillsData.success) {
        setSkills(skillsData.data)
        setSelectedSkills(skillsData.data.map((s: Skill) => s._id!))
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExperience = (id: string) => {
    setSelectedExperiences((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    )
  }

  const toggleFormation = (id: string) => {
    setSelectedFormations((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    )
  }

  const toggleSkill = (id: string) => {
    setSelectedSkills((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const handleDownload = async () => {
    setGenerating(true)
    try {
      await generatePDF()
    } catch (error) {
      console.error('Failed to generate PDF:', error)
    } finally {
      setGenerating(false)
    }
  }

  const selectedExperienceData = experiences.filter((e) => selectedExperiences.includes(e._id!))
  const selectedFormationData = formations.filter((f) => selectedFormations.includes(f._id!))
  const selectedSkillData = skills.filter((s) => selectedSkills.includes(s._id!))

  const hasData = profile || experiences.length > 0 || formations.length > 0 || skills.length > 0
  const hasSelection = selectedExperiences.length > 0 || selectedFormations.length > 0 || selectedSkills.length > 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">CV Generator</h1>
          </div>
          <p className="text-muted">
            Select the items you want to include and generate your CV.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowTemplates(!showTemplates)}
            className="gap-2"
          >
            <Palette className="w-4 h-4" />
            Templates
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-2"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
          <Button
            onClick={handleDownload}
            disabled={!hasSelection || generating}
            loading={generating}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !hasData ? (
        <Card className="text-center py-12">
          <FileText className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No data yet</h3>
          <p className="text-muted mb-6">
            Start by adding your profile, experiences, formations, and skills.
          </p>
        </Card>
      ) : (
        <>
          {/* Template Selector */}
          {showTemplates && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <Card>
                <TemplateSelector
                  selectedTemplate={selectedTemplate}
                  onSelectTemplate={setSelectedTemplate}
                />
              </Card>
            </motion.div>
          )}

          <div className={`grid gap-6 ${showPreview ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
          {/* Selector Panel */}
          <Card className="h-fit">
            <h2 className="text-lg font-semibold text-foreground mb-4">Select Items</h2>
            <CVSelector
              experiences={experiences}
              formations={formations}
              skills={skills}
              selectedExperiences={selectedExperiences}
              selectedFormations={selectedFormations}
              selectedSkills={selectedSkills}
              onToggleExperience={toggleExperience}
              onToggleFormation={toggleFormation}
              onToggleSkill={toggleSkill}
            />

            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Selected items:</span>
                <span className="text-foreground font-medium">
                  {selectedExperiences.length} exp, {selectedFormations.length} edu, {selectedSkills.length} skills
                </span>
              </div>
            </div>
          </Card>

          {/* Preview Panel */}
          {showPreview && (
            <div className="bg-card border border-border rounded-xl p-4 overflow-auto">
              <h2 className="text-lg font-semibold text-foreground mb-4">Preview</h2>
              <div className="overflow-auto max-h-[800px] flex justify-center">
                <div className="transform scale-[0.5] origin-top">
                  <CVPreview
                    id="cv-preview-display"
                    profile={profile}
                    experiences={selectedExperienceData}
                    formations={selectedFormationData}
                    skills={selectedSkillData}
                    templateId={selectedTemplate}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        </>
      )}

      {/* Hidden full-size preview for PDF generation */}
      <div className="fixed -left-[9999px] -top-[9999px]">
        <CVPreview
          id="cv-preview-pdf"
          profile={profile}
          experiences={selectedExperienceData}
          formations={selectedFormationData}
          skills={selectedSkillData}
          templateId={selectedTemplate}
        />
      </div>
    </div>
  )
}
