'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import { Briefcase, GraduationCap, Wrench, Send, CheckCircle, TrendingUp } from 'lucide-react'
import { demoStats } from '@/data/demo-data'

function AnimatedCounter({ value, duration = 2 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return

    let startTime: number
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
      setCount(Math.floor(progress * value))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [isInView, value, duration])

  return <span ref={ref}>{count}</span>
}

const stats = [
  {
    icon: Briefcase,
    label: 'Experiences',
    value: demoStats.experiences,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: GraduationCap,
    label: 'Formations',
    value: demoStats.formations,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    icon: Wrench,
    label: 'Skills',
    value: demoStats.skills,
    color: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-500/10',
  },
  {
    icon: Send,
    label: 'Applications',
    value: demoStats.applications,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-500/10',
  },
]

export default function DemoStats() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            className={`${stat.bgColor} border border-border rounded-xl p-4 backdrop-blur-sm`}
          >
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-3xl font-bold text-foreground">
              <AnimatedCounter value={stat.value} />
            </div>
            <div className="text-sm text-muted">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Application Tracker Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="bg-card border border-border rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Application Tracker</h3>
        </div>

        <div className="space-y-3">
          {[
            { company: 'SwissTech AG', status: 'Interview', color: 'bg-purple-500' },
            { company: 'Digital Solutions', status: 'Sent', color: 'bg-blue-500' },
            { company: 'TechStart GmbH', status: 'Accepted', color: 'bg-green-500' },
          ].map((app, index) => (
            <motion.div
              key={app.company}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="flex items-center justify-between"
            >
              <span className="text-sm text-foreground">{app.company}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${app.color}/20 text-foreground`}>
                {app.status}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Success rate */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="mt-4 pt-4 border-t border-border"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Interview Rate</span>
            <span className="flex items-center gap-1 text-green-500 font-medium">
              <CheckCircle className="w-4 h-4" />
              33%
            </span>
          </div>
          <div className="mt-2 h-2 bg-card rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: '33%' }}
              viewport={{ once: true }}
              transition={{ delay: 1, duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Label */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.6 }}
        className="text-center"
      >
        <span className="text-sm text-muted">Track your job applications</span>
      </motion.div>
    </div>
  )
}
