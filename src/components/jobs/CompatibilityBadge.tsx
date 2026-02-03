'use client'

import { motion } from 'framer-motion'
import { Loader2, AlertCircle, Sparkles, Info } from 'lucide-react'
import { ScoreStatus } from '@/types'

interface CompatibilityBadgeProps {
  score?: number
  status?: ScoreStatus
  error?: string
  className?: string
  hasDetails?: boolean
  onDetailsClick?: () => void
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'bg-green-500/20 text-green-400 border-green-500/30'
  if (score >= 50) return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
  return 'bg-red-500/20 text-red-400 border-red-500/30'
}

function getScoreGradient(score: number): string {
  if (score >= 70) return 'from-green-500 to-emerald-500'
  if (score >= 50) return 'from-orange-500 to-amber-500'
  return 'from-red-500 to-rose-500'
}

export default function CompatibilityBadge({
  score,
  status = 'pending',
  error,
  className = '',
  hasDetails = false,
  onDetailsClick,
}: CompatibilityBadgeProps) {
  // Error state
  if (status === 'error') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 ${className}`}
        title={error || 'Score calculation failed'}
      >
        <AlertCircle className="w-3 h-3" />
        <span>Error</span>
      </div>
    )
  }

  // Calculating state
  if (status === 'calculating') {
    return (
      <motion.div
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 ${className}`}
      >
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Calculating...</span>
      </motion.div>
    )
  }

  // Pending state
  if (status === 'pending' || score === undefined) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20 ${className}`}
      >
        <Sparkles className="w-3 h-3" />
        <span>Pending</span>
      </div>
    )
  }

  // Completed state with score
  const badge = (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getScoreColor(score)} ${
        hasDetails && onDetailsClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
      } ${className}`}
      onClick={hasDetails && onDetailsClick ? onDetailsClick : undefined}
    >
      <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getScoreGradient(score)}`} />
      <span>{Math.round(score)}% match</span>
      {hasDetails && onDetailsClick && <Info className="w-3 h-3 ml-0.5 opacity-70" />}
    </motion.div>
  )

  return badge
}
