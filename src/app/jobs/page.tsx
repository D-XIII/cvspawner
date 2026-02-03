'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Loader2,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  MapPin,
  Building,
  Briefcase,
  Globe,
  DollarSign,
  Trash2,
  Filter,
  Sparkles,
  RefreshCw,
} from 'lucide-react'
import Card, { CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import CompatibilityBadge from '@/components/jobs/CompatibilityBadge'
import { ScrapedJob, ScrapeRequest } from '@/types'

const siteColors: Record<string, string> = {
  indeed: 'bg-blue-500/20 text-blue-400',
  linkedin: 'bg-sky-500/20 text-sky-400',
  glassdoor: 'bg-green-500/20 text-green-400',
  zip_recruiter: 'bg-orange-500/20 text-orange-400',
  google: 'bg-red-500/20 text-red-400',
}

export default function JobsPage() {
  const [savedJobs, setSavedJobs] = useState<ScrapedJob[]>([])
  const [scrapedJobs, setScrapedJobs] = useState<ScrapedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [scraping, setScraping] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'search' | 'saved'>('search')
  const [calculatingScores, setCalculatingScores] = useState(false)
  const [scoreStats, setScoreStats] = useState<{ pending: number; calculating: number; completed: number; error: number } | null>(null)

  // Search form state
  const [searchTerm, setSearchTerm] = useState('')
  const [location, setLocation] = useState('Switzerland')
  const [resultsWanted, setResultsWanted] = useState(20)
  const [remoteOnly, setRemoteOnly] = useState(false)

  useEffect(() => {
    fetchSavedJobs()
    fetchScoreStats()
  }, [])

  // Poll for score updates when there are jobs being calculated
  useEffect(() => {
    if (scoreStats?.calculating && scoreStats.calculating > 0) {
      const interval = setInterval(() => {
        fetchSavedJobs()
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
        await Promise.all([fetchSavedJobs(), fetchScoreStats()])
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to calculate scores. Make sure the scoring service is running.' })
    } finally {
      setCalculatingScores(false)
    }
  }

  const fetchSavedJobs = async () => {
    try {
      const res = await fetch('/api/jobs')
      const data = await res.json()
      if (data.success) {
        setSavedJobs(data.data)
      }
    } catch {
      console.error('Failed to fetch saved jobs')
    } finally {
      setLoading(false)
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
    setScrapedJobs([])

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
        setScrapedJobs(data.jobs)
        setMessage({
          type: 'success',
          text: `Found ${data.total} jobs${data.message ? ` - ${data.message}` : ''}`,
        })
      } else {
        setMessage({ type: 'error', text: data.error || 'Scraping failed' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to scrape jobs. Make sure the scraper service is running.' })
    } finally {
      setScraping(false)
    }
  }

  const handleSaveJob = async (job: ScrapedJob) => {
    const jobKey = `${job.title}-${job.company}`
    setSaving(jobKey)

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(job),
      })

      const data = await res.json()

      if (data.success) {
        setSavedJobs([data.data, ...savedJobs])
        setMessage({ type: 'success', text: 'Job saved! Score will be calculated in background.' })
        setTimeout(() => setMessage(null), 3000)
        // Refresh score stats
        fetchScoreStats()
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save job' })
    } finally {
      setSaving(null)
    }
  }

  const handleDeleteJob = async (id: string) => {
    if (!confirm('Remove this saved job?')) return

    try {
      const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (data.success) {
        setSavedJobs(savedJobs.filter((j) => j._id !== id))
        setMessage({ type: 'success', text: 'Job removed' })
        setTimeout(() => setMessage(null), 2000)
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete job' })
    }
  }

  const isJobSaved = (job: ScrapedJob) => {
    return savedJobs.some(
      (saved) => saved.title === job.title && saved.company === job.company && saved.site === job.site
    )
  }

  const formatSalary = (job: ScrapedJob) => {
    if (!job.salaryMin && !job.salaryMax) return null
    const currency = job.salaryCurrency || 'CHF'
    if (job.salaryMin && job.salaryMax) {
      return `${currency} ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`
    }
    if (job.salaryMin) return `${currency} ${job.salaryMin.toLocaleString()}+`
    return `Up to ${currency} ${job.salaryMax?.toLocaleString()}`
  }

  const JobCard = ({ job, showSaveButton = false, showDeleteButton = false }: { job: ScrapedJob; showSaveButton?: boolean; showDeleteButton?: boolean }) => (
    <Card hover>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="truncate">{job.title}</CardTitle>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${siteColors[job.site] || 'bg-gray-500/20 text-gray-400'}`}>
                {job.site}
              </span>
              {job.isRemote && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                  Remote
                </span>
              )}
              {job._id && (
                <CompatibilityBadge
                  score={job.compatibilityScore}
                  status={job.scoreStatus}
                  error={job.scoreError}
                />
              )}
            </div>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Building className="w-3 h-3" />
              {job.company}
              {job.location && (
                <>
                  <span className="text-border">•</span>
                  <MapPin className="w-3 h-3" />
                  {job.location}
                </>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      {/* Salary and type */}
      <div className="flex flex-wrap gap-3 text-sm text-muted mb-3">
        {formatSalary(job) && (
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            {formatSalary(job)}
          </span>
        )}
        {job.jobType && (
          <span className="flex items-center gap-1">
            <Briefcase className="w-3 h-3" />
            {job.jobType}
          </span>
        )}
        {job.datePosted && (
          <span className="text-xs">Posted: {job.datePosted}</span>
        )}
      </div>

      {/* Description preview */}
      {job.description && (
        <p className="text-sm text-muted line-clamp-2 mb-3">{job.description}</p>
      )}

      <CardFooter>
        {job.jobUrl && (
          <a
            href={job.jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            View Job
          </a>
        )}
        <div className="flex-1" />
        {showSaveButton && (
          <Button
            variant={isJobSaved(job) ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => handleSaveJob(job)}
            disabled={isJobSaved(job) || saving === `${job.title}-${job.company}`}
            className="gap-1"
          >
            {isJobSaved(job) ? (
              <>
                <BookmarkCheck className="w-3 h-3" />
                Saved
              </>
            ) : saving === `${job.title}-${job.company}` ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Bookmark className="w-3 h-3" />
                Save
              </>
            )}
          </Button>
        )}
        {showDeleteButton && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDeleteJob(job._id!)}
            className="gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Remove
          </Button>
        )}
      </CardFooter>
    </Card>
  )

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

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'search'
              ? 'bg-primary text-white'
              : 'bg-card border border-border text-muted hover:text-foreground'
          }`}
        >
          <Search className="w-4 h-4 inline mr-2" />
          Search Jobs
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'saved'
              ? 'bg-primary text-white'
              : 'bg-card border border-border text-muted hover:text-foreground'
          }`}
        >
          <Bookmark className="w-4 h-4 inline mr-2" />
          Saved Jobs ({savedJobs.length})
        </button>
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

      {activeTab === 'search' && (
        <>
          {/* Search Form */}
          <Card className="mb-6">
            <form onSubmit={handleScrape} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Job Title / Keywords"
                  placeholder="e.g., Software Engineer, React Developer"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<Search className="w-4 h-4" />}
                  required
                />
                <Input
                  label="Location"
                  placeholder="e.g., Switzerland, Geneva, Zurich"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  icon={<MapPin className="w-4 h-4" />}
                />
              </div>

              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Results
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
                  <span className="text-sm text-foreground">Remote only</span>
                </label>

                <div className="flex-1" />

                <Button type="submit" disabled={scraping} loading={scraping} className="gap-2">
                  <Search className="w-4 h-4" />
                  {scraping ? 'Searching...' : 'Search Jobs'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Search Results */}
          {scraping ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-muted">Searching across job boards...</p>
              <p className="text-sm text-muted">This may take a moment</p>
            </div>
          ) : scrapedJobs.length > 0 ? (
            <div className="grid gap-4">
              <AnimatePresence>
                {scrapedJobs.map((job, index) => (
                  <motion.div
                    key={`${job.title}-${job.company}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <JobCard job={job} showSaveButton />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <Card className="text-center py-12">
              <Search className="w-12 h-12 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Search for Jobs</h3>
              <p className="text-muted">
                Enter a job title and location to search across multiple job boards.
              </p>
            </Card>
          )}
        </>
      )}

      {activeTab === 'saved' && (
        <>
          {/* Score calculation controls */}
          {savedJobs.length > 0 && (
            <Card className="mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    CV Compatibility Scores
                  </h3>
                  <p className="text-xs text-muted mt-1">
                    Calculate how well your CV matches each saved job.
                  </p>
                  {scoreStats && (
                    <div className="flex gap-3 mt-2 text-xs text-muted">
                      {scoreStats.pending > 0 && (
                        <span>{scoreStats.pending} pending</span>
                      )}
                      {scoreStats.calculating > 0 && (
                        <span className="text-blue-400">{scoreStats.calculating} calculating...</span>
                      )}
                      {scoreStats.completed > 0 && (
                        <span className="text-green-400">{scoreStats.completed} completed</span>
                      )}
                      {scoreStats.error > 0 && (
                        <span className="text-red-400">{scoreStats.error} errors</span>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleCalculateScores}
                  disabled={calculatingScores || (scoreStats?.pending === 0 && scoreStats?.error === 0)}
                  loading={calculatingScores}
                  className="gap-2"
                >
                  {calculatingScores ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Calculate Scores
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : savedJobs.length === 0 ? (
            <Card className="text-center py-12">
              <Bookmark className="w-12 h-12 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Saved Jobs</h3>
              <p className="text-muted mb-4">
                Save jobs from your search results to view them here.
              </p>
              <Button onClick={() => setActiveTab('search')} className="gap-2">
                <Search className="w-4 h-4" />
                Search Jobs
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              <AnimatePresence>
                {savedJobs.map((job) => (
                  <motion.div
                    key={job._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <JobCard job={job} showDeleteButton />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </div>
  )
}
