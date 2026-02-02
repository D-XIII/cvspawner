'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { CVTemplate, cvTemplates } from '@/lib/cv-templates'

interface TemplateSelectorProps {
  selectedTemplate: string
  onSelectTemplate: (templateId: string) => void
}

export default function TemplateSelector({ selectedTemplate, onSelectTemplate }: TemplateSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">Choose Template</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {cvTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={selectedTemplate === template.id}
            onClick={() => onSelectTemplate(template.id)}
          />
        ))}
      </div>
    </div>
  )
}

function TemplateCard({
  template,
  isSelected,
  onClick,
}: {
  template: CVTemplate
  isSelected: boolean
  onClick: () => void
}) {
  const colors = template.colors

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative rounded-lg border-2 overflow-hidden transition-all ${
        isSelected
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-border hover:border-primary/50'
      }`}
    >
      {/* Mini preview */}
      <div
        className="aspect-[210/297] p-2"
        style={{ backgroundColor: colors.background }}
      >
        {/* Header preview */}
        <div
          className="rounded-sm p-1.5 mb-1.5"
          style={{
            background: colors.headerBg,
          }}
        >
          <div
            className="h-1.5 w-12 rounded-full mb-1"
            style={{ backgroundColor: colors.headerText, opacity: 0.9 }}
          />
          <div
            className="h-1 w-8 rounded-full"
            style={{ backgroundColor: colors.headerText, opacity: 0.5 }}
          />
        </div>

        {/* Content preview */}
        <div className="flex gap-1.5">
          {/* Main content */}
          <div className="flex-1 space-y-1">
            <div
              className="h-1 w-full rounded-full"
              style={{ backgroundColor: colors.text, opacity: 0.3 }}
            />
            <div
              className="h-1 w-3/4 rounded-full"
              style={{ backgroundColor: colors.text, opacity: 0.2 }}
            />
            <div
              className="h-1 w-5/6 rounded-full"
              style={{ backgroundColor: colors.text, opacity: 0.2 }}
            />
          </div>

          {/* Sidebar preview */}
          <div
            className="w-1/3 rounded-sm p-1"
            style={{ backgroundColor: colors.sidebarBg === '#ffffff' ? colors.skillBg : colors.sidebarBg }}
          >
            <div
              className="h-1 w-full rounded-full mb-1"
              style={{ backgroundColor: colors.primary, opacity: 0.6 }}
            />
            <div className="flex flex-wrap gap-0.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-1 w-3 rounded-full"
                  style={{ backgroundColor: colors.skillBg === '#ffffff' ? colors.border : colors.skillText, opacity: 0.5 }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Template name */}
      <div className="px-2 py-1.5 bg-card border-t border-border">
        <p className="text-xs font-medium text-foreground truncate">{template.name}</p>
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
    </motion.button>
  )
}
