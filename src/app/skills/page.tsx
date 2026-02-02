'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wrench, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import Card, { CardHeader, CardTitle, CardFooter } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import SkillForm from '@/components/forms/SkillForm'
import { Skill } from '@/types'

const categoryLabels: Record<string, string> = {
  technical: 'Technical Skills',
  soft: 'Soft Skills',
  language: 'Languages',
  tool: 'Tools',
}

const categoryColors: Record<string, string> = {
  technical: 'from-blue-500 to-cyan-500',
  soft: 'from-purple-500 to-pink-500',
  language: 'from-green-500 to-emerald-500',
  tool: 'from-orange-500 to-red-500',
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | undefined>()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchSkills()
  }, [])

  const fetchSkills = async () => {
    try {
      const res = await fetch('/api/skills')
      const data = await res.json()
      if (data.success) {
        setSkills(data.data)
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to fetch skills' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (formData: Partial<Skill>) => {
    try {
      const url = editingSkill
        ? `/api/skills/${editingSkill._id}`
        : '/api/skills'
      const method = editingSkill ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()

      if (data.success) {
        await fetchSkills()
        setModalOpen(false)
        setEditingSkill(undefined)
        setMessage({ type: 'success', text: `Skill ${editingSkill ? 'updated' : 'created'}!` })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save skill' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this skill?')) return

    try {
      const res = await fetch(`/api/skills/${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (data.success) {
        setSkills(skills.filter((s) => s._id !== id))
        setMessage({ type: 'success', text: 'Skill deleted!' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete skill' })
    }
  }

  const openEditModal = (skill: Skill) => {
    setEditingSkill(skill)
    setModalOpen(true)
  }

  const openCreateModal = () => {
    setEditingSkill(undefined)
    setModalOpen(true)
  }

  const groupedSkills = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = []
    acc[skill.category].push(skill)
    return acc
  }, {} as Record<string, Skill[]>)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Skills</h1>
          </div>
          <p className="text-muted">
            Manage your technical skills, languages, and tools.
          </p>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Skill
        </Button>
      </motion.div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-success/10 border border-success/20 text-success'
              : 'bg-error/10 border border-error/20 text-error'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : skills.length === 0 ? (
        <Card className="text-center py-12">
          <Wrench className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No skills yet</h3>
          <p className="text-muted mb-6">Start adding your skills and competencies.</p>
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Your First Skill
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6">
          {Object.entries(groupedSkills).map(([category, categorySkills]) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${categoryColors[category]}`} />
                    <CardTitle>{categoryLabels[category]}</CardTitle>
                  </div>
                </CardHeader>
                <div className="flex flex-wrap gap-3">
                  <AnimatePresence>
                    {categorySkills.map((skill) => (
                      <motion.div
                        key={skill._id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="group relative"
                      >
                        <div className="flex items-center gap-2 px-4 py-2 bg-card-hover border border-border rounded-lg">
                          <span className="text-foreground font-medium">{skill.name}</span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <div
                                key={level}
                                className={`w-1.5 h-3 rounded-full ${
                                  level <= skill.level ? 'bg-primary' : 'bg-border'
                                }`}
                              />
                            ))}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                            <button
                              onClick={() => openEditModal(skill)}
                              className="p-1 hover:bg-card rounded text-muted hover:text-foreground transition-colors"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(skill._id!)}
                              className="p-1 hover:bg-error/10 rounded text-muted hover:text-error transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingSkill(undefined)
        }}
        title={editingSkill ? 'Edit Skill' : 'Add Skill'}
      >
        <SkillForm
          skill={editingSkill}
          onSubmit={handleSubmit}
          onCancel={() => {
            setModalOpen(false)
            setEditingSkill(undefined)
          }}
        />
      </Modal>
    </div>
  )
}
