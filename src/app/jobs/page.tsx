'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Loader2,
  MapPin,
  Globe,
  Sparkles,
  CheckCircle,
  Star,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import LocationAutocomplete from '@/components/ui/LocationAutocomplete'
import Modal from '@/components/ui/Modal'
import ScoreDetailsModal from '@/components/jobs/ScoreDetailsModal'
import JobCard from '@/components/jobs/JobCard'
import ApplicationForm from '@/components/forms/ApplicationForm'
import { ScrapedJob, ScrapeRequest, Application, ScoreDetails, JobStatus } from '@/types'

type JobFilter = 'all' | 'saved' | 'applied'

export default function JobsPage() {
  // All jobs from database
  const [jobs, setJobs] = useState<ScrapedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [scraping, setScraping] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [jobFilter, setJobFilter] = useState<JobFilter>('all')
  const [calculatingScores, setCalculatingScores] = useState(false)
  const [scoreStats, setScoreStats] = useState<{ pending: number; calculating: number; completed: number; error: number } | null>(null)

  // Applications state
  const [applicationsByJob, setApplicationsByJob] = useState<Record<string, Application>>({})
  const [applicationModalOpen, setApplicationModalOpen] = useState(false)
  const [selectedJobForApplication, setSelectedJobForApplication] = useState<ScrapedJob | null>(null)
  const [editingApplication, setEditingApplication] = useState<Application | undefined>()

  // Score details modal state
  const [scoreDetailsModalOpen, setScoreDetailsModalOpen] = useState(false)
  const [selectedJobForScore, setSelectedJobForScore] = useState<ScrapedJob | null>(null)

  // Search form state
  const [searchTerm, setSearchTerm] = useState('')
  const [location, setLocation] = useState('')
  const [resultsWanted, setResultsWanted] = useState(20)
  const [remoteOnly, setRemoteOnly] = useState(false)

  // Auto-detect user location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation('Switzerland') // Fallback
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          )
          if (response.ok) {
            const data = await response.json()
            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.municipality
            const country = data.address?.country
            if (city && country) {
              setLocation(`${city}, ${country}`)
            } else if (country) {
              setLocation(country)
            }
          }
        } catch {
          setLocation('Switzerland') // Fallback on error
        }
      },
      () => {
        setLocation('Switzerland') // Fallback if denied
      },
      { timeout: 5000 }
    )
  }, [])

  useEffect(() => {
    fetchJobs()
    fetchScoreStats()
  }, [])

  // Fetch applications when jobs change
  useEffect(() => {
    if (jobs.length > 0) {
      fetchApplicationsForJobs()
    }
  }, [jobs])

  const fetchApplicationsForJobs = async () => {
    const jobIds = jobs.map((job) => job._id).filter(Boolean)
    if (jobIds.length === 0) return

    try {
      const res = await fetch(`/api/applications/by-job?jobIds=${jobIds.join(',')}`)
      const data = await res.json()
      if (data.success) {
        setApplicationsByJob(data.data)
      }
    } catch {
      console.error('Failed to fetch applications')
    }
  }

  // Poll for score updates when there are jobs being calculated
  useEffect(() => {
    if (scoreStats?.calculating && scoreStats.calculating > 0) {
      const interval = setInterval(() => {
        fetchJobs()
        fetchScoreStats()
      }, 3000) // Poll every 3 seconds
      return () => clearInterval(interval)
    }
  }, [scoreStats?.calculating])

  const fetchScoreStats = async () => {
    try {
      const res = await fetch('/api/jobs/calculate-scores')
      const data = await res.json()
      if (data.success) {
        setScoreStats(data.data)
      }
    } catch {
      console.error('Failed to fetch score stats')
    }
  }

  const handleCalculateScores = async () => {
    setCalculatingScores(true)
    setMessage(null)

    try {
      const res = await fetch('/api/jobs/calculate-scores', {
        method: 'POST',
      })
      const data = await res.json()

      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        // Refresh jobs and stats
        await Promise.all([fetchJobs(), fetchScoreStats()])
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to calculate scores. Make sure the scoring service is running.' })
    } finally {
      setCalculatingScores(false)
    }
  }

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs')
      const data = await res.json()
      if (data.success) {
        setJobs(data.data)
      }
    } catch {
      console.error('Failed to fetch jobs')
    } finally {
      setLoading(false)
    }
  }

  // Stream scores via SSE for scraped jobs
  const streamScores = async (scrapedJobs: ScrapedJob[]) => {
    try {
      const jobsForScoring = scrapedJobs.map((job, index) => ({
        index,
        id: job._id, // Include job ID for database updates
        title: job.title,
        company: job.company,
        description: job.description,
      }))

      const response = await fetch('/api/jobs/score-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobs: jobsForScoring }),
      })

      // Check if response is SSE or JSON error
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        const data = await response.json()
        if (data.error === 'cv_empty') {
          // CV is empty, no scores to calculate
          return
        }
        if (data.error) {
          console.error('Score stream error:', data.error)
          return
        }
      }

      // Parse SSE stream
      const reader = response.body?.getReader()
      if (!reader) return

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        let eventType = ''
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7)
          } else if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))

            if (eventType === 'score') {
              // Update jobs state
              const jobId = scrapedJobs[data.index]?._id
              if (jobId) {
                setJobs((prev) =>
                  prev.map((job) =>
                    job._id === jobId
                      ? {
                          ...job,
                          compatibilityScore: data.score,
                          scoreStatus: data.status,
                          scoreError: data.error,
                          scoreDetails: data.details as ScoreDetails | undefined,
                        }
                      : job
                  )
                )
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Score streaming error:', err)
      // Scores failed but jobs are still visible - graceful degradation
    }
  }

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) {
      setMessage({ type: 'error', text: 'Please enter a search term' })
      return
    }

    setScraping(true)
    setMessage(null)

    try {
      const request: ScrapeRequest = {
        searchTerm: searchTerm.trim(),
        location: location.trim() || undefined,
        resultsWanted,
        remoteOnly,
      }

      const res = await fetch('/api/jobs/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      const data = await res.json()

      if (data.success) {
        // Jobs are now auto-saved to DB with status 'scraped'
        // Add to jobs list (at the beginning)
        setJobs((prev) => {
          const existingIds = new Set(prev.map((j) => j._id))
          const newJobs = data.jobs.filter((j: ScrapedJob) => !existingIds.has(j._id))
          return [...newJobs, ...prev]
        })
        setMessage({
          type: 'success',
          text: `${data.total} offres trouvées${data.message ? ` - ${data.message}` : ''}`,
        })
        setScraping(false)

        // Start streaming scores in background
        if (data.jobs.length > 0) {
          // Mark new jobs as calculating
          const newJobIds = new Set(data.jobs.map((j: ScrapedJob) => j._id))
          setJobs((prev) =>
            prev.map((job) =>
              newJobIds.has(job._id) ? { ...job, scoreStatus: 'calculating' as const } : job
            )
          )
          streamScores(data.jobs)
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Scraping failed' })
        setScraping(false)
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to scrape jobs. Make sure the scraper service is running.' })
      setScraping(false)
    }
  }

  const handleUpdateJobStatus = async (job: ScrapedJob, newStatus: JobStatus) => {
    if (!job._id) return

    setUpdatingStatus(job._id)

    try {
      const res = await fetch(`/api/jobs/${job._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await res.json()

      if (data.success) {
        // Update local state
        setJobs((prev) =>
          prev.map((j) =>
            j._id === job._id
              ? { ...j, status: newStatus, appliedAt: newStatus === 'applied' ? new Date() : j.appliedAt }
              : j
          )
        )

        const statusMessages: Record<JobStatus, string> = {
          scraped: 'Retiré des favoris',
          saved: 'Ajouté aux favoris!',
          applied: 'Marqué comme postulé!',
        }
        setMessage({ type: 'success', text: statusMessages[newStatus] })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Échec de la mise à jour' })
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleViewScoreDetails = (job: ScrapedJob) => {
    setSelectedJobForScore(job)
    setScoreDetailsModalOpen(true)
  }

  const handleApplyToJob = (job: ScrapedJob) => {
    const existingApp = job._id ? applicationsByJob[job._id] : undefined
    if (existingApp) {
      // Open modal to edit existing application
      setEditingApplication(existingApp)
      setSelectedJobForApplication(job)
    } else {
      // Create new application
      setEditingApplication(undefined)
      setSelectedJobForApplication(job)
    }
    setApplicationModalOpen(true)
  }

  const handleApplicationSubmit = async (formData: Partial<Application>) => {
    try {
      const isEditing = !!editingApplication
      const url = isEditing
        ? `/api/applications/${editingApplication._id}`
        : '/api/applications'
      const method = isEditing ? 'PUT' : 'POST'

      const body = isEditing
        ? formData
        : {
            ...formData,
            jobId: selectedJobForApplication?._id,
          }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (data.success) {
        // Update local state
        if (selectedJobForApplication?._id) {
          setApplicationsByJob((prev) => ({
            ...prev,
            [selectedJobForApplication._id!]: data.data,
          }))

          // Also update job status to 'applied' if this is a new application
          if (!isEditing) {
            handleUpdateJobStatus(selectedJobForApplication, 'applied')
          }
        }
        setApplicationModalOpen(false)
        setSelectedJobForApplication(null)
        setEditingApplication(undefined)
        setMessage({
          type: 'success',
          text: isEditing ? 'Candidature mise à jour!' : 'Candidature créée!',
        })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Échec de la sauvegarde' })
    }
  }

  const handleDeleteJob = async (id: string) => {
    if (!confirm('Supprimer ce job définitivement ?')) return

    try {
      const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (data.success) {
        setJobs(jobs.filter((j) => j._id !== id))
        setMessage({ type: 'success', text: 'Job supprimé' })
        setTimeout(() => setMessage(null), 2000)
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Échec de la suppression' })
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Job Search</h1>
        </div>
        <p className="text-muted">
          Search jobs across Indeed, LinkedIn, Glassdoor, and more.
        </p>
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

      {/* Search Form */}
      <Card className="mb-6">
        <form onSubmit={handleScrape} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Titre / Mots-clés"
              placeholder="ex: Software Engineer, React Developer"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4" />}
              required
            />
            <LocationAutocomplete
              label="Localisation"
              placeholder="ex: Switzerland, Geneva, Zurich"
              value={location}
              onChange={setLocation}
              icon={<MapPin className="w-4 h-4" />}
            />
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Résultats
              </label>
              <select
                value={resultsWanted}
                onChange={(e) => setResultsWanted(Number(e.target.value))}
                className="px-3 py-2 bg-card border border-border rounded-lg text-foreground"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(e) => setRemoteOnly(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary"
              />
              <span className="text-sm text-foreground">Remote uniquement</span>
            </label>

            <div className="flex-1" />

            <Button type="submit" disabled={scraping} loading={scraping} className="gap-2">
              <Search className="w-4 h-4" />
              {scraping ? 'Recherche...' : 'Rechercher'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Filters & Score calculation */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setJobFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              jobFilter === 'all'
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-card border border-border text-muted hover:text-foreground'
            }`}
          >
            Tous ({jobs.length})
          </button>
          <button
            onClick={() => setJobFilter('saved')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              jobFilter === 'saved'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-card border border-border text-muted hover:text-foreground'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            Favoris ({jobs.filter((j) => j.status === 'saved').length})
          </button>
          <button
            onClick={() => setJobFilter('applied')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              jobFilter === 'applied'
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                : 'bg-card border border-border text-muted hover:text-foreground'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Postulé ({jobs.filter((j) => j.status === 'applied').length})
          </button>
        </div>

        {/* Score calculation */}
        {jobs.length > 0 && (
          <div className="flex items-center gap-3 ml-auto">
            {scoreStats && (
              <div className="flex gap-2 text-xs text-muted">
                {scoreStats.pending > 0 && (
                  <span>{scoreStats.pending} en attente</span>
                )}
                {scoreStats.calculating > 0 && (
                  <span className="text-blue-400">{scoreStats.calculating} en cours...</span>
                )}
              </div>
            )}
            <Button
              onClick={handleCalculateScores}
              disabled={calculatingScores || (scoreStats?.pending === 0 && scoreStats?.error === 0)}
              loading={calculatingScores}
              size="sm"
              className="gap-1.5"
            >
              {calculatingScores ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              Calculer scores
            </Button>
          </div>
        )}
      </div>

      {/* Job List */}
      {scraping ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted">Recherche en cours...</p>
          <p className="text-sm text-muted">Cela peut prendre un moment</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : jobs.length === 0 ? (
        <Card className="text-center py-12">
          <Search className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Aucun job</h3>
          <p className="text-muted">
            Lancez une recherche pour découvrir des offres d&apos;emploi.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {jobs
              .filter((job) => {
                if (jobFilter === 'all') return true
                if (jobFilter === 'saved') return job.status === 'saved'
                if (jobFilter === 'applied') return job.status === 'applied'
                return true
              })
              .map((job) => {
                const application = job._id ? applicationsByJob[job._id] : undefined
                const hasApplied = job.status === 'applied' || !!application
                return (
                  <motion.div
                    key={job._id}
                    layout
                    initial={false}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <JobCard
                      job={job}
                      showFavoriteButton
                      showDeleteButton
                      showApplyButton
                      hasApplied={hasApplied}
                      isUpdating={updatingStatus === job._id}
                      onUpdateStatus={handleUpdateJobStatus}
                      onDelete={handleDeleteJob}
                      onApply={handleApplyToJob}
                      onViewScoreDetails={handleViewScoreDetails}
                    />
                  </motion.div>
                )
              })}
          </AnimatePresence>
          {jobs.filter((job) => {
            if (jobFilter === 'all') return true
            if (jobFilter === 'saved') return job.status === 'saved'
            if (jobFilter === 'applied') return job.status === 'applied'
            return true
          }).length === 0 && (
            <Card className="text-center py-8">
              <p className="text-muted">
                Aucun job dans cette catégorie.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Application Modal */}
      <Modal
        isOpen={applicationModalOpen}
        onClose={() => {
          setApplicationModalOpen(false)
          setSelectedJobForApplication(null)
          setEditingApplication(undefined)
        }}
        title={editingApplication ? 'Edit Application' : 'Apply to Job'}
        size="lg"
      >
        <ApplicationForm
          application={editingApplication || (selectedJobForApplication ? {
            company: selectedJobForApplication.company,
            position: selectedJobForApplication.title,
            location: selectedJobForApplication.location || '',
            url: selectedJobForApplication.jobUrl || '',
            status: 'draft',
          } as Application : undefined)}
          onSubmit={handleApplicationSubmit}
          onCancel={() => {
            setApplicationModalOpen(false)
            setSelectedJobForApplication(null)
            setEditingApplication(undefined)
          }}
        />
      </Modal>

      {/* Score Details Modal */}
      <ScoreDetailsModal
        isOpen={scoreDetailsModalOpen}
        onClose={() => {
          setScoreDetailsModalOpen(false)
          setSelectedJobForScore(null)
        }}
        jobTitle={selectedJobForScore?.title || ''}
        company={selectedJobForScore?.company || ''}
        details={selectedJobForScore?.scoreDetails}
      />
    </div>
  )
}
