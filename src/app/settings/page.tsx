'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, Key, Check, AlertCircle, Loader2, Trash2, ExternalLink } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LLMProvider } from '@/types'

interface SettingsData {
  provider: LLMProvider | null
  isConfigured: boolean
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [provider, setProvider] = useState<LLMProvider>('claude')
  const [apiKey, setApiKey] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()

      if (data.success) {
        setSettings(data.data)
        if (data.data.provider) {
          setProvider(data.data.provider)
        }
      }
    } catch {
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('API key is required')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const method = settings?.isConfigured ? 'PUT' : 'POST'
      const response = await fetch('/api/settings', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey: apiKey.trim() }),
      })

      const data = await response.json()

      if (data.success) {
        setSettings(data.data)
        setApiKey('')
        setSuccess('Settings saved successfully!')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(data.error || 'Failed to save settings')
      }
    } catch {
      setError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove your LLM configuration?')) {
      return
    }

    setDeleting(true)
    setError(null)

    try {
      const response = await fetch('/api/settings', { method: 'DELETE' })
      const data = await response.json()

      if (data.success) {
        setSettings({ provider: null, isConfigured: false })
        setSuccess('Configuration removed')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(data.error || 'Failed to remove configuration')
      }
    } catch {
      setError('Failed to remove configuration')
    } finally {
      setDeleting(false)
    }
  }

  const providerInfo: Record<LLMProvider, { name: string; description: string; url: string }> = {
    claude: {
      name: 'Claude (Anthropic)',
      description: 'Recommended for high-quality translations',
      url: 'https://console.anthropic.com/settings/keys',
    },
    openai: {
      name: 'ChatGPT (OpenAI)',
      description: 'Coming soon',
      url: 'https://platform.openai.com/api-keys',
    },
    gemini: {
      name: 'Gemini (Google)',
      description: 'Coming soon',
      url: 'https://aistudio.google.com/app/apikey',
    },
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        </div>
        <p className="text-muted">Configure your LLM provider for CV translation</p>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            {/* Status */}
            <div className="flex items-center gap-3 mb-6 p-4 rounded-lg bg-card border border-border">
              {settings?.isConfigured ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">LLM Configured</p>
                    <p className="text-sm text-muted">
                      Using {providerInfo[settings.provider!]?.name}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">No LLM Configured</p>
                    <p className="text-sm text-muted">
                      Add an API key to enable CV translation
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Provider Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                LLM Provider
              </label>
              <div className="grid gap-3">
                {(Object.keys(providerInfo) as LLMProvider[]).map((p) => (
                  <label
                    key={p}
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                      provider === p
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    } ${p !== 'claude' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="radio"
                      name="provider"
                      value={p}
                      checked={provider === p}
                      onChange={(e) => setProvider(e.target.value as LLMProvider)}
                      disabled={p !== 'claude'}
                      className="w-4 h-4 text-primary"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{providerInfo[p].name}</p>
                      <p className="text-sm text-muted">{providerInfo[p].description}</p>
                    </div>
                    <a
                      href={providerInfo[p].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted hover:text-foreground"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </label>
                ))}
              </div>
            </div>

            {/* API Key Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                <Key className="w-4 h-4 inline mr-2" />
                API Key
              </label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={settings?.isConfigured ? '••••••••••••••••' : 'sk-ant-...'}
                className="w-full"
              />
              <p className="text-xs text-muted mt-2">
                Your API key is encrypted and stored securely. We never share it with third parties.
              </p>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-sm">
                {success}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={handleSave} loading={saving} className="flex-1">
                {settings?.isConfigured ? 'Update API Key' : 'Save API Key'}
              </Button>
              {settings?.isConfigured && (
                <Button
                  variant="secondary"
                  onClick={handleDelete}
                  loading={deleting}
                  className="text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </Card>

          {/* Help Section */}
          <Card className="mt-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">How it works</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li className="flex items-start gap-2">
                <span className="text-primary">1.</span>
                Get an API key from your chosen provider (Claude recommended)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">2.</span>
                Paste your API key above and save
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">3.</span>
                When generating a CV, you can now choose to download in French or English
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">4.</span>
                The translation uses AI to translate your profile, experience descriptions, and more
              </li>
            </ul>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
