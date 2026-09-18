import { GoogleGenAI, type Content, type GenerateContentConfig, type GenerateContentResponse } from '@google/genai'
import { aiEnabled, googleAIRegion, googleProjectID } from '@repo/dally/ai'
import { getGoogleServiceAccountCredentials } from '@/lib/google/credentials'
import { sanitizePrompt } from '@/lib/model-armor/sanitize'

export type ScreenedGenerateContentParameters = {
  model: string
  contents: Content[]
  config?: GenerateContentConfig
}

export type ScreenedGenAI = {
  models: { generateContent: (params: ScreenedGenerateContentParameters) => Promise<GenerateContentResponse> }
}

let client: ScreenedGenAI | null | undefined

const screenContents = (contents: Content[], signal?: AbortSignal): Promise<Content[]> =>
  Promise.all(
    contents.map(async (content) => {
      if (content.role === 'model' || !content.parts) return content
      return {
        ...content,
        parts: await Promise.all(content.parts.map(async (part) => (part.text ? { ...part, text: await sanitizePrompt(part.text, signal) } : part))),
      }
    }),
  )

export const getVertexGenAI = (): ScreenedGenAI | null => {
  if (client !== undefined) return client

  const credentials = aiEnabled && googleProjectID ? getGoogleServiceAccountCredentials() : null
  if (!credentials) {
    client = null
    return client
  }

  const genAI = new GoogleGenAI({ vertexai: true, project: googleProjectID, location: googleAIRegion, googleAuthOptions: { credentials } })

  client = {
    models: {
      generateContent: async ({ model, contents, config }) => genAI.models.generateContent({ model, contents: await screenContents(contents, config?.abortSignal), config }),
    },
  }

  return client
}
