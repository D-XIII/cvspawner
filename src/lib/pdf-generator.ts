import { CVData } from '@/types'

export function formatDateRange(
  startDate: string | Date,
  endDate: string | Date | null | undefined,
  current: boolean
): string {
  const start = new Date(startDate).toLocaleDateString('fr-FR', {
    month: 'short',
    year: 'numeric',
  })

  if (current) return `${start} - Present`
  if (!endDate) return start

  const end = new Date(endDate).toLocaleDateString('fr-FR', {
    month: 'short',
    year: 'numeric',
  })

  return `${start} - ${end}`
}

export function groupSkillsByCategory(skills: CVData['skills']) {
  return skills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = []
    acc[skill.category].push(skill)
    return acc
  }, {} as Record<string, CVData['skills']>)
}

export async function generatePDF(elementId: string = 'cv-preview-pdf'): Promise<void> {
  const cvPreview = document.getElementById(elementId)
  if (!cvPreview) {
    throw new Error(`CV preview element not found: ${elementId}`)
  }

  // Dynamic import to avoid SSR issues
  const html2pdf = (await import('html2pdf.js')).default

  const options = {
    margin: 0,
    filename: 'cv.pdf',
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait' as const,
    },
  }

  await html2pdf().set(options).from(cvPreview).save()
}
