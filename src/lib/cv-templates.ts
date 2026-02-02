export interface CVTemplate {
  id: string
  name: string
  description: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    headerBg: string
    headerText: string
    sidebarBg: string
    sidebarText: string
    text: string
    textMuted: string
    border: string
    skillBg: string
    skillText: string
  }
  layout: 'classic' | 'sidebar-left' | 'sidebar-right' | 'top-header'
  headerStyle: 'simple' | 'banner' | 'centered'
  fontStyle: 'sans' | 'serif' | 'modern'
}

export const cvTemplates: CVTemplate[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Clean and professional, perfect for traditional industries',
    colors: {
      primary: '#1f2937',
      secondary: '#4b5563',
      accent: '#3b82f6',
      background: '#ffffff',
      headerBg: '#ffffff',
      headerText: '#111827',
      sidebarBg: '#ffffff',
      sidebarText: '#374151',
      text: '#111827',
      textMuted: '#6b7280',
      border: '#e5e7eb',
      skillBg: '#f3f4f6',
      skillText: '#374151',
    },
    layout: 'classic',
    headerStyle: 'simple',
    fontStyle: 'sans',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Bold and contemporary with a colorful header',
    colors: {
      primary: '#7c3aed',
      secondary: '#8b5cf6',
      accent: '#a78bfa',
      background: '#ffffff',
      headerBg: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
      headerText: '#ffffff',
      sidebarBg: '#ffffff',
      sidebarText: '#374151',
      text: '#1f2937',
      textMuted: '#6b7280',
      border: '#e5e7eb',
      skillBg: '#ede9fe',
      skillText: '#5b21b6',
    },
    layout: 'classic',
    headerStyle: 'banner',
    fontStyle: 'modern',
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Sophisticated with subtle gold accents',
    colors: {
      primary: '#78350f',
      secondary: '#92400e',
      accent: '#b45309',
      background: '#fffbeb',
      headerBg: '#fffbeb',
      headerText: '#78350f',
      sidebarBg: '#fef3c7',
      sidebarText: '#78350f',
      text: '#292524',
      textMuted: '#57534e',
      border: '#d6d3d1',
      skillBg: '#fef3c7',
      skillText: '#78350f',
    },
    layout: 'classic',
    headerStyle: 'centered',
    fontStyle: 'serif',
  },
  {
    id: 'tech',
    name: 'Tech',
    description: 'Modern tech style with dark sidebar',
    colors: {
      primary: '#06b6d4',
      secondary: '#0891b2',
      accent: '#22d3ee',
      background: '#ffffff',
      headerBg: '#0f172a',
      headerText: '#f1f5f9',
      sidebarBg: '#1e293b',
      sidebarText: '#e2e8f0',
      text: '#1e293b',
      textMuted: '#64748b',
      border: '#334155',
      skillBg: '#0f172a',
      skillText: '#22d3ee',
    },
    layout: 'sidebar-left',
    headerStyle: 'simple',
    fontStyle: 'modern',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Ultra-clean with maximum whitespace',
    colors: {
      primary: '#18181b',
      secondary: '#27272a',
      accent: '#18181b',
      background: '#ffffff',
      headerBg: '#ffffff',
      headerText: '#18181b',
      sidebarBg: '#ffffff',
      sidebarText: '#3f3f46',
      text: '#18181b',
      textMuted: '#71717a',
      border: '#e4e4e7',
      skillBg: '#ffffff',
      skillText: '#3f3f46',
    },
    layout: 'classic',
    headerStyle: 'simple',
    fontStyle: 'sans',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Fresh blue tones, professional and calming',
    colors: {
      primary: '#0369a1',
      secondary: '#0284c7',
      accent: '#0ea5e9',
      background: '#f0f9ff',
      headerBg: 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)',
      headerText: '#ffffff',
      sidebarBg: '#e0f2fe',
      sidebarText: '#0c4a6e',
      text: '#0c4a6e',
      textMuted: '#64748b',
      border: '#bae6fd',
      skillBg: '#bae6fd',
      skillText: '#0369a1',
    },
    layout: 'classic',
    headerStyle: 'banner',
    fontStyle: 'sans',
  },
]

export const getTemplate = (id: string): CVTemplate => {
  return cvTemplates.find((t) => t.id === id) || cvTemplates[0]
}
