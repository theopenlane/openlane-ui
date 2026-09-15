import type { LanguageModelMiddleware } from 'ai'
import { sanitizePrompt } from '@/lib/model-armor/sanitize'

export const modelArmorMiddleware: LanguageModelMiddleware = {
  transformParams: async ({ params }) => ({
    ...params,
    prompt: await Promise.all(
      params.prompt.map(async (message) => {
        if (message.role !== 'user') return message
        return {
          ...message,
          content: await Promise.all(message.content.map(async (part) => (part.type === 'text' ? { ...part, text: await sanitizePrompt(part.text, params.abortSignal) } : part))),
        }
      }),
    ),
  }),
}
