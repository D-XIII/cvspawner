'use client'

import { motion } from 'framer-motion'
import { X, CheckCircle, XCircle, Briefcase, Tag, AlertTriangle } from 'lucide-react'
import { ScoreDetails } from '@/types'

interface ScoreDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  jobTitle: string
  company: string
  details: ScoreDetails | undefined
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green-400'
  if (score >= 50) return 'text-orange-400'
  return 'text-red-400'
}

function getScoreBg(score: number): string {
  if (score >= 70) return 'bg-green-500/20'
  if (score >= 50) return 'bg-orange-500/20'
  return 'bg-red-500/20'
}

export default function ScoreDetailsModal({
  isOpen,
  onClose,
  jobTitle,
  company,
  details,
}: ScoreDetailsModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden mx-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Score Details</h2>
            <p className="text-sm text-muted">
              {jobTitle} at {company}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted/20 transition-colors"
          >
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(85vh-80px)]">
          {!details ? (
            <div className="text-center py-8 text-muted">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Score details not available</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Global Score */}
              <div className={`rounded-xl p-4 ${getScoreBg(details.globalScore)}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Global Compatibility</span>
                  <span className={`text-3xl font-bold ${getScoreColor(details.globalScore)}`}>
                    {Math.round(details.globalScore)}%
                  </span>
                </div>
              </div>

              {/* Experience Matches */}
              {details.experienceMatches.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" />
                    Experience Relevance
                  </h3>
                  <div className="space-y-2">
                    {details.experienceMatches.map((exp, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          exp.relevant
                            ? 'border-green-500/30 bg-green-500/5'
                            : 'border-border bg-card'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {exp.title}
                          </p>
                          {exp.company && (
                            <p className="text-xs text-muted truncate">{exp.company}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <span className={`text-sm font-semibold ${getScoreColor(exp.score)}`}>
                            {Math.round(exp.score)}%
                          </span>
                          {exp.relevant ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-muted" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Skills */}
              {details.matchedSkills.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Your Matching Skills ({details.matchedSkills.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {details.matchedSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Keywords */}
              {details.matchedKeywords.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-blue-400" />
                    Matched Keywords ({details.matchedKeywords.length}/{details.totalKeywords})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {details.matchedKeywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Keywords */}
              {details.missingKeywords.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-400" />
                    Missing Keywords ({details.missingKeywords.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {details.missingKeywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted mt-2">
                    Consider adding these skills to your CV if you have them.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
