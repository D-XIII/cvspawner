'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Briefcase, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import Card, { CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import ExperienceForm from '@/components/forms/ExperienceForm'
import { Experience } from '@/types'

export default function ExperiencesPage() {
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingExperience, setEditingExperience] = useState<Experience | undefined>()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchExperiences()
  }, [])

  const fetchExperiences = async () => {
    try {
      const res = await fetch('/api/experiences')
      const data = await res.json()
      if (data.success) {
        setExperiences(data.data)
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to fetch experiences' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (formData: Partial<Experience>) => {
    try {
      const url = editingExperience
        ? `/api/experiences/${editingExperience._id}`
        : '/api/experiences'
      const method = editingExperience ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()

      if (data.success) {
        await fetchExperiences()
        setModalOpen(false)
        setEditingExperience(undefined)
        setMessage({ type: 'success', text: `Experience ${editingExperience ? 'updated' : 'created'}!` })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save experience' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this experience?')) return

    try {
      const res = await fetch(`/api/experiences/${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (data.success) {
        setExperiences(experiences.filter((e) => e._id !== id))
        setMessage({ type: 'success', text: 'Experience deleted!' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete experience' })
    }
  }

  const openEditModal = (experience: Experience) => {
    setEditingExperience(experience)
    setModalOpen(true)
  }

  const openCreateModal = () => {
    setEditingExperience(undefined)
    setModalOpen(true)
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Experiences</h1>
          </div>
          <p className="text-muted">
            Manage your professional experiences and work history.
          </p>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Experience
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
      ) : experiences.length === 0 ? (
        <Card className="text-center py-12">
          <Briefcase className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No experiences yet</h3>
          <p className="text-muted mb-6">Start adding your professional experiences.</p>
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Your First Experience
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {experiences.map((experience) => (
              <motion.div
                key={experience._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card hover>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{experience.title}</CardTitle>
                        <CardDescription>
                          {experience.company}
                          {experience.location && ` • ${experience.location}`}
                        </CardDescription>
                      </div>
                      <span className="text-sm text-muted whitespace-nowrap">
                        {formatDate(experience.startDate)} -{' '}
                        {experience.current ? 'Present' : formatDate(experience.endDate!)}
                      </span>
                    </div>
                  </CardHeader>
                  <p className="text-sm text-muted line-clamp-2">{experience.description}</p>
                  {experience.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {experience.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                  <CardFooter>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(experience)}
                      className="gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(experience._id!)}
                      className="gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingExperience(undefined)
        }}
        title={editingExperience ? 'Edit Experience' : 'Add Experience'}
        size="lg"
      >
        <ExperienceForm
          experience={editingExperience}
          onSubmit={handleSubmit}
          onCancel={() => {
            setModalOpen(false)
            setEditingExperience(undefined)
          }}
        />
      </Modal>
    </div>
  )
}
