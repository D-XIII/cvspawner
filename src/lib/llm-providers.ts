import Anthropic from '@anthropic-ai/sdk'
import type { Profile, Experience, Formation, Skill, TranslationLanguage } from '@/types'

const CLAUDE_MODEL = 'claude-sonnet-4-20250514'

/**
 * Translate text using Claude API
 */
export async function translateWithClaude(
  text: string,
  targetLanguage: TranslationLanguage,
  apiKey: string
): Promise<string> {
  if (!text || !text.trim()) {
    return text
  }

  const client = new Anthropic({ apiKey })

  const languageNames: Record<TranslationLanguage, string> = {
    en: 'English',
    fr: 'French',
  }

  const targetLang = languageNames[targetLanguage]

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Translate the following text to ${targetLang}. Only respond with the translation, nothing else. If the text is already in ${targetLang}, return it as is.

Text to translate:
${text}`,
      },
    ],
  })

  const content = response.content[0]
  if (content.type === 'text') {
    return content.text
  }

  return text
}

interface CVContent {
  profile: Profile | null
  experiences: Experience[]
  formations: Formation[]
  skills: Skill[]
}

/**
 * Translate CV content
 * Only translates: title, summary, descriptions
 * Does NOT translate: names, companies, schools, skill names, emails, phones
 */
export async function translateCV(
  content: CVContent,
  targetLanguage: TranslationLanguage,
  apiKey: string
): Promise<CVContent> {
  const result: CVContent = {
    profile: content.profile ? { ...content.profile } : null,
    experiences: content.experiences.map((exp) => ({ ...exp })),
    formations: content.formations.map((form) => ({ ...form })),
    skills: content.skills.map((skill) => ({ ...skill })),
  }

  // Collect all texts to translate in one batch for efficiency
  const textsToTranslate: { key: string; text: string }[] = []

  // Profile fields to translate
  if (result.profile) {
    if (result.profile.title) {
      textsToTranslate.push({ key: 'profile.title', text: result.profile.title })
    }
    if (result.profile.summary) {
      textsToTranslate.push({ key: 'profile.summary', text: result.profile.summary })
    }
  }

  // Experience fields to translate
  result.experiences.forEach((exp, index) => {
    if (exp.title) {
      textsToTranslate.push({ key: `exp.${index}.title`, text: exp.title })
    }
    if (exp.description) {
      textsToTranslate.push({ key: `exp.${index}.description`, text: exp.description })
    }
  })

  // Formation fields to translate
  result.formations.forEach((form, index) => {
    if (form.degree) {
      textsToTranslate.push({ key: `form.${index}.degree`, text: form.degree })
    }
    if (form.description) {
      textsToTranslate.push({ key: `form.${index}.description`, text: form.description })
    }
  })

  // If nothing to translate, return early
  if (textsToTranslate.length === 0) {
    return result
  }

  // Translate all texts in a single API call for efficiency
  const translatedTexts = await translateBatch(textsToTranslate, targetLanguage, apiKey)

  // Apply translations back to result
  for (const { key, translated } of translatedTexts) {
    if (key === 'profile.title' && result.profile) {
      result.profile.title = translated
    } else if (key === 'profile.summary' && result.profile) {
      result.profile.summary = translated
    } else if (key.startsWith('exp.')) {
      const [, indexStr, field] = key.split('.')
      const index = parseInt(indexStr, 10)
      if (field === 'title') {
        result.experiences[index].title = translated
      } else if (field === 'description') {
        result.experiences[index].description = translated
      }
    } else if (key.startsWith('form.')) {
      const [, indexStr, field] = key.split('.')
      const index = parseInt(indexStr, 10)
      if (field === 'degree') {
        result.formations[index].degree = translated
      } else if (field === 'description') {
        result.formations[index].description = translated
      }
    }
  }

  return result
}

/**
 * Translate multiple texts in a single API call
 */
async function translateBatch(
  items: { key: string; text: string }[],
  targetLanguage: TranslationLanguage,
  apiKey: string
): Promise<{ key: string; translated: string }[]> {
  const client = new Anthropic({ apiKey })

  const languageNames: Record<TranslationLanguage, string> = {
    en: 'English',
    fr: 'French',
  }

  const targetLang = languageNames[targetLanguage]

  // Format items for batch translation
  const itemsText = items
    .map((item, index) => `[${index}] ${item.text}`)
    .join('\n\n')

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `Translate each of the following numbered texts to ${targetLang}.
Maintain the exact same numbering format [0], [1], etc.
Only respond with the translations, keeping the same structure.
If a text is already in ${targetLang}, return it as is.

${itemsText}`,
      },
    ],
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    // Return original texts if something goes wrong
    return items.map((item) => ({ key: item.key, translated: item.text }))
  }

  // Parse the response
  const translatedLines = content.text.split(/\n\n|\n(?=\[\d+\])/)
  const results: { key: string; translated: string }[] = []

  for (let i = 0; i < items.length; i++) {
    const line = translatedLines.find((l) => l.startsWith(`[${i}]`))
    if (line) {
      // Remove the [index] prefix
      const translated = line.replace(/^\[\d+\]\s*/, '').trim()
      results.push({ key: items[i].key, translated })
    } else {
      // Fallback to original if parsing fails
      results.push({ key: items[i].key, translated: items[i].text })
    }
  }

  return results
}
