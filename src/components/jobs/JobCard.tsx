'use client'

import { memo } from 'react'
import {
  ExternalLink,
  MapPin,
  Building,
  Briefcase,
  DollarSign,
  Trash2,
  Send,
  CheckCircle,
  Star,
  Clock,
  Loader2,
} from 'lucide-react'
import Card, { CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import CompatibilityBadge from '@/components/jobs/CompatibilityBadge'
import { ScrapedJob, JobStatus } from '@/types'

const siteColors: Record<string, string> = {
  indeed: 'bg-blue-500/20 text-blue-400',
  linkedin: 'bg-sky-500/20 text-sky-400',
  glassdoor: 'bg-green-500/20 text-green-400',
  zip_recruiter: 'bg-orange-500/20 text-orange-400',
  google: 'bg-red-500/20 text-red-400',
}

interface JobCardProps {
  job: ScrapedJob
  showFavoriteButton?: boolean
  showDeleteButton?: boolean
  showApplyButton?: boolean
  hasApplied?: boolean
  isUpdating?: boolean
  onUpdateStatus?: (job: ScrapedJob, status: JobStatus) => void
  onDelete?: (id: string) => void
  onApply?: (job: ScrapedJob) => void
  onViewScoreDetails?: (job: ScrapedJob) => void
}

function formatSalary(job: ScrapedJob): string | null {
  if (!job.salaryMin && !job.salaryMax) return null
  const currency = job.salaryCurrency || 'CHF'
  if (job.salaryMin && job.salaryMax) {
    return `${currency} ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`
  }
  if (job.salaryMin) return `${currency} ${job.salaryMin.toLocaleString()}+`
  return `Up to ${currency} ${job.salaryMax?.toLocaleString()}`
}

function JobCardComponent({
  job,
  showFavoriteButton = false,
  showDeleteButton = false,
  showApplyButton = false,
  hasApplied = false,
  isUpdating = false,
  onUpdateStatus,
  onDelete,
  onApply,
  onViewScoreDetails,
}: JobCardProps) {
  const isFavorite = job.status === 'saved' || job.status === 'applied'

  return (
    <Card hover className="max-w-full overflow-hidden">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="truncate max-w-[300px] sm:max-w-none">{job.title}</CardTitle>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${siteColors[job.site] || 'bg-gray-500/20 text-gray-400'}`}>
                {job.site}
              </span>
              {job.isRemote && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                  Remote
                </span>
              )}
              {job.status === 'saved' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Favori
                </span>
              )}
              {hasApplied && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Postulé
                </span>
              )}
              {job.status === 'scraped' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Récent
                </span>
              )}
              <CompatibilityBadge
                score={job.compatibilityScore}
                status={job.scoreStatus}
                error={job.scoreError}
                hasDetails={!!job.scoreDetails}
                onDetailsClick={() => onViewScoreDetails?.(job)}
              />
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
        {showFavoriteButton && onUpdateStatus && (
          <Button
            variant={isFavorite ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onUpdateStatus(job, isFavorite ? 'scraped' : 'saved')}
            disabled={isUpdating}
            className="gap-1"
          >
            {isUpdating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : isFavorite ? (
              <>
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                Favori
              </>
            ) : (
              <>
                <Star className="w-3 h-3" />
                Ajouter aux favoris
              </>
            )}
          </Button>
        )}
        {showDeleteButton && onDelete && job._id && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(job._id!)}
            className="gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Supprimer
          </Button>
        )}
        {showApplyButton && onApply && (
          <Button
            variant={hasApplied ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => onApply(job)}
            className="gap-1"
          >
            <Send className="w-3 h-3" />
            {hasApplied ? 'Voir candidature' : 'Postuler'}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

// Memo pour éviter les re-renders inutiles
const JobCard = memo(JobCardComponent)

export default JobCard
