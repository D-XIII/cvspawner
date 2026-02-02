'use client'

import { motion } from 'framer-motion'
import { Github } from 'lucide-react'

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="border-t border-border bg-card/50 mt-auto"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between">
          <p className="text-muted text-sm">
            © {new Date().getFullYear()} CVSpawner
          </p>

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted hover:text-foreground transition-colors"
          >
            <Github className="w-5 h-5" />
          </a>
        </div>
      </div>
    </motion.footer>
  )
}
