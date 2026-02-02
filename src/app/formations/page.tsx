'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import Card, { CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import FormationForm from '@/components/forms/FormationForm'
import { Formation } from '@/types'

export default function FormationsPage() {
  const [formations, setFormations] = useState<Formation[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingFormation, setEditingFormation] = useState<Formation | undefined>()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchFormations()
  }, [])

  const fetchFormations = async () => {
    try {
      const res = await fetch('/api/formations')
      const data = await res.json()
      if (data.success) {
        setFormations(data.data)
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to fetch formations' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (formData: Partial<Formation>) => {
    try {
      const url = editingFormation
        ? `/api/formations/${editingFormation._id}`
        : '/api/formations'
      const method = editingFormation ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()

      if (data.success) {
        await fetchFormations()
        setModalOpen(false)
        setEditingFormation(undefined)
        setMessage({ type: 'success', text: `Formation ${editingFormation ? 'updated' : 'created'}!` })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save formation' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this formation?')) return

    try {
      const res = await fetch(`/api/formations/${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (data.success) {
        setFormations(formations.filter((f) => f._id !== id))
        setMessage({ type: 'success', text: 'Formation deleted!' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete formation' })
    }
  }

  const openEditModal = (formation: Formation) => {
    setEditingFormation(formation)
    setModalOpen(true)
  }

  const openCreateModal = () => {
    setEditingFormation(undefined)
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Formations</h1>
          </div>
          <p className="text-muted">
            Manage your educational background and certifications.
          </p>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Formation
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
      ) : formations.length === 0 ? (
        <Card className="text-center py-12">
          <GraduationCap className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No formations yet</h3>
          <p className="text-muted mb-6">Start adding your educational background.</p>
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Your First Formation
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {formations.map((formation) => (
              <motion.div
                key={formation._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card hover>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{formation.degree}</CardTitle>
                        <CardDescription>
                          {formation.school}
                          {formation.location && ` • ${formation.location}`}
                        </CardDescription>
                      </div>
                      <span className="text-sm text-muted whitespace-nowrap">
                        {formatDate(formation.startDate)} -{' '}
                        {formation.current ? 'Present' : formatDate(formation.endDate!)}
                      </span>
                    </div>
                  </CardHeader>
                  {formation.description && (
                    <p className="text-sm text-muted line-clamp-2">{formation.description}</p>
                  )}
                  <CardFooter>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(formation)}
                      className="gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(formation._id!)}
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
          setEditingFormation(undefined)
        }}
        title={editingFormation ? 'Edit Formation' : 'Add Formation'}
        size="lg"
      >
        <FormationForm
          formation={editingFormation}
          onSubmit={handleSubmit}
          onCancel={() => {
            setModalOpen(false)
            setEditingFormation(undefined)
          }}
        />
      </Modal>
    </div>
  )
}
