'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Plus, Pencil, Trash2, Loader2, ExternalLink } from 'lucide-react'
import Card, { CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import ApplicationForm from '@/components/forms/ApplicationForm'
import { Application, ApplicationStatus } from '@/types'

const statusConfig: Record<ApplicationStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-500/20 text-gray-400' },
  sent: { label: 'Sent', color: 'bg-blue-500/20 text-blue-400' },
  followed_up: { label: 'Followed Up', color: 'bg-yellow-500/20 text-yellow-400' },
  interview: { label: 'Interview', color: 'bg-purple-500/20 text-purple-400' },
  rejected: { label: 'Rejected', color: 'bg-red-500/20 text-red-400' },
  accepted: { label: 'Accepted', color: 'bg-green-500/20 text-green-400' },
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingApplication, setEditingApplication] = useState<Application | undefined>()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('all')

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/applications')
      const data = await res.json()
      if (data.success) {
        setApplications(data.data)
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to fetch applications' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (formData: Partial<Application>) => {
    try {
      const url = editingApplication
        ? `/api/applications/${editingApplication._id}`
        : '/api/applications'
      const method = editingApplication ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()

      if (data.success) {
        await fetchApplications()
        setModalOpen(false)
        setEditingApplication(undefined)
        setMessage({ type: 'success', text: `Application ${editingApplication ? 'updated' : 'created'}!` })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save application' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return

    try {
      const res = await fetch(`/api/applications/${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (data.success) {
        setApplications(applications.filter((a) => a._id !== id))
        setMessage({ type: 'success', text: 'Application deleted!' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete application' })
    }
  }

  const openEditModal = (application: Application) => {
    setEditingApplication(application)
    setModalOpen(true)
  }

  const openCreateModal = () => {
    setEditingApplication(undefined)
    setModalOpen(true)
  }

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const filteredApplications = filter === 'all'
    ? applications
    : applications.filter((a) => a.status === filter)

  const stats = {
    total: applications.length,
    sent: applications.filter((a) => a.status === 'sent').length,
    interview: applications.filter((a) => a.status === 'interview').length,
    accepted: applications.filter((a) => a.status === 'accepted').length,
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <Send className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Applications</h1>
          </div>
          <p className="text-muted">
            Track your job applications and their status.
          </p>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Application
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-muted text-sm">Total</p>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-muted text-sm">Sent</p>
          <p className="text-2xl font-bold text-blue-400">{stats.sent}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-muted text-sm">Interviews</p>
          <p className="text-2xl font-bold text-purple-400">{stats.interview}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-muted text-sm">Accepted</p>
          <p className="text-2xl font-bold text-green-400">{stats.accepted}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            filter === 'all' ? 'bg-primary text-white' : 'bg-card border border-border text-muted hover:text-foreground'
          }`}
        >
          All
        </button>
        {Object.entries(statusConfig).map(([status, config]) => (
          <button
            key={status}
            onClick={() => setFilter(status as ApplicationStatus)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filter === status ? 'bg-primary text-white' : 'bg-card border border-border text-muted hover:text-foreground'
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>

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
      ) : filteredApplications.length === 0 ? (
        <Card className="text-center py-12">
          <Send className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {filter === 'all' ? 'No applications yet' : `No ${statusConfig[filter as ApplicationStatus]?.label.toLowerCase()} applications`}
          </h3>
          <p className="text-muted mb-6">
            {filter === 'all' ? 'Start tracking your job applications.' : 'Try a different filter.'}
          </p>
          {filter === 'all' && (
            <Button onClick={openCreateModal} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Your First Application
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {filteredApplications.map((application) => (
              <motion.div
                key={application._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card hover>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <CardTitle>{application.position}</CardTitle>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[application.status].color}`}>
                            {statusConfig[application.status].label}
                          </span>
                        </div>
                        <CardDescription>
                          {application.company}
                          {application.location && ` • ${application.location}`}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-muted">
                          Applied: {formatDate(application.appliedAt)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  {application.notes && (
                    <p className="text-sm text-muted line-clamp-2">{application.notes}</p>
                  )}
                  <CardFooter>
                    {application.url && (
                      <a
                        href={application.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Job
                      </a>
                    )}
                    <div className="flex-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(application)}
                      className="gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(application._id!)}
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
          setEditingApplication(undefined)
        }}
        title={editingApplication ? 'Edit Application' : 'Add Application'}
        size="lg"
      >
        <ApplicationForm
          application={editingApplication}
          onSubmit={handleSubmit}
          onCancel={() => {
            setModalOpen(false)
            setEditingApplication(undefined)
          }}
        />
      </Modal>
    </div>
  )
}
