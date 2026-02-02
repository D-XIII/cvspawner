'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Loader2, Eye, EyeOff, Palette, Languages, ChevronDown, Settings } from 'lucide-react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import CVSelector from '@/components/cv/CVSelector'
import CVPreview from '@/components/cv/CVPreview'
import TemplateSelector from '@/components/cv/TemplateSelector'
import { generatePDF } from '@/lib/pdf-generator'
import { Profile, Experience, Formation, Skill, TranslationLanguage, LLMSettings } from '@/types'

export default function GeneratorPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [formations, setFormations] = useState<Formation[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('modern')
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
  const [llmSettings, setLLMSettings] = useState<LLMSettings | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Translated data for PDF generation
  const [translatedProfile, setTranslatedProfile] = useState<Profile | null>(null)
  const [translatedExperiences, setTranslatedExperiences] = useState<Experience[]>([])
  const [translatedFormations, setTranslatedFormations] = useState<Formation[]>([])
  const [currentLanguage, setCurrentLanguage] = useState<TranslationLanguage | null>(null)

  const downloadMenuRef = useRef<HTMLDivElement>(null)

  const [selectedExperiences, setSelectedExperiences] = useState<string[]>([])
  const [selectedFormations, setSelectedFormations] = useState<string[]>([])
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])

  useEffect(() => {
    fetchAllData()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setShowDownloadMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchAllData = async () => {
    try {
      const [profileRes, experiencesRes, formationsRes, skillsRes, settingsRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/experiences'),
        fetch('/api/formations'),
        fetch('/api/skills'),
        fetch('/api/settings'),
      ])

      const [profileData, experiencesData, formationsData, skillsData, settingsData] = await Promise.all([
        profileRes.json(),
        experiencesRes.json(),
        formationsRes.json(),
        skillsRes.json(),
        settingsRes.json(),
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
      if (settingsData.success) {
        setLLMSettings(settingsData.data)
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

  const handleDownload = async (language?: TranslationLanguage) => {
    setShowDownloadMenu(false)
    setError(null)

    if (language) {
      // Translate first, then generate PDF
      setTranslating(true)
      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: {
              profile,
              experiences: selectedExperienceData,
              formations: selectedFormationData,
              skills: selectedSkillData,
            },
            targetLanguage: language,
          }),
        })

        const data = await response.json()

        if (!data.success) {
          setError(data.error || 'Translation failed')
          setTranslating(false)
          return
        }

        // Store translated data for PDF generation
        setTranslatedProfile(data.data.profile)
        setTranslatedExperiences(data.data.experiences)
        setTranslatedFormations(data.data.formations)
        setCurrentLanguage(language)

        // Wait for state update and re-render
        setTimeout(async () => {
          setTranslating(false)
          setGenerating(true)
          try {
            await generatePDF('cv-preview-translated')
          } catch (error) {
            console.error('Failed to generate PDF:', error)
          } finally {
            setGenerating(false)
            // Clear translated data
            setTranslatedProfile(null)
            setTranslatedExperiences([])
            setTranslatedFormations([])
            setCurrentLanguage(null)
          }
        }, 100)
      } catch (error) {
        console.error('Translation failed:', error)
        setError('Translation failed. Please try again.')
        setTranslating(false)
      }
    } else {
      // Generate PDF without translation
      setGenerating(true)
      try {
        await generatePDF()
      } catch (error) {
        console.error('Failed to generate PDF:', error)
      } finally {
        setGenerating(false)
      }
    }
  }

  const selectedExperienceData = experiences.filter((e) => selectedExperiences.includes(e._id!))
  const selectedFormationData = formations.filter((f) => selectedFormations.includes(f._id!))
  const selectedSkillData = skills.filter((s) => selectedSkills.includes(s._id!))

  const hasData = profile || experiences.length > 0 || formations.length > 0 || skills.length > 0
  const hasSelection = selectedExperiences.length > 0 || selectedFormations.length > 0 || selectedSkills.length > 0
  const isProcessing = generating || translating

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

          {/* Download Button with Dropdown */}
          <div className="relative" ref={downloadMenuRef}>
            {llmSettings?.isConfigured ? (
              <>
                <Button
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                  disabled={!hasSelection || isProcessing}
                  loading={isProcessing}
                  className="gap-2"
                >
                  {translating ? (
                    <>
                      <Languages className="w-4 h-4" />
                      Translating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download
                      <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </Button>

                {showDownloadMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50"
                  >
                    <button
                      onClick={() => handleDownload()}
                      className="w-full px-4 py-3 text-left text-sm text-foreground hover:bg-primary/10 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Original
                    </button>
                    <button
                      onClick={() => handleDownload('fr')}
                      className="w-full px-4 py-3 text-left text-sm text-foreground hover:bg-primary/10 flex items-center gap-2 border-t border-border"
                    >
                      <Languages className="w-4 h-4" />
                      Français
                    </button>
                    <button
                      onClick={() => handleDownload('en')}
                      className="w-full px-4 py-3 text-left text-sm text-foreground hover:bg-primary/10 flex items-center gap-2 border-t border-border"
                    >
                      <Languages className="w-4 h-4" />
                      English
                    </button>
                  </motion.div>
                )}
              </>
            ) : (
              <Button
                onClick={() => handleDownload()}
                disabled={!hasSelection || isProcessing}
                loading={isProcessing}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* LLM Setup Banner */}
      {!loading && !llmSettings?.isConfigured && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Languages className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Enable CV Translation</p>
              <p className="text-xs text-muted">Configure an LLM to download your CV in French or English</p>
            </div>
          </div>
          <Link href="/settings">
            <Button variant="secondary" size="sm" className="gap-2">
              <Settings className="w-4 h-4" />
              Setup
            </Button>
          </Link>
        </motion.div>
      )}

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

      {/* Hidden full-size preview for PDF generation (original) */}
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

      {/* Hidden full-size preview for PDF generation (translated) */}
      {currentLanguage && (
        <div className="fixed -left-[9999px] -top-[9999px]">
          <CVPreview
            id="cv-preview-translated"
            profile={translatedProfile}
            experiences={translatedExperiences}
            formations={translatedFormations}
            skills={selectedSkillData}
            templateId={selectedTemplate}
            language={currentLanguage}
          />
        </div>
      )}
    </div>
  )
}
