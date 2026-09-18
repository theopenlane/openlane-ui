import { auth } from '@/lib/auth/auth'
import { FinishReason } from '@google/genai'
import { type NextRequest, NextResponse } from 'next/server'
import { VertexRagServiceClient } from '@google-cloud/aiplatform'
import { Storage } from '@google-cloud/storage'
import { getGoogleServiceAccountCredentials } from '@/lib/google/credentials'
import { getVertexGenAI } from '@/lib/google/vertex-genai'
import { sanitizePrompt } from '@/lib/model-armor/sanitize'
import { modelArmorErrorResponse } from '@/lib/model-armor/responses'
import { z } from 'zod'
import {
  aiEnabled,
  googleAIRegion,
  googleProjectID,
  aiLogBucket,
  aiSystemInstruction,
  controlSystemInstruction,
  temperature,
  maxOutputTokens,
  geminiModelName,
  ragCorpusID,
  policySystemInstruction,
} from '@repo/dally/ai'

export const runtime = 'nodejs'
export const maxDuration = 60

const requestSchema = z.object({
  section: z.string().optional(),
  prompt: z.string().trim().min(1),
  context: z.unknown().optional(),
})

let storage: Storage | null = null
let ragClient: VertexRagServiceClient | null = null

const genAI = getVertexGenAI()
const creds = genAI ? getGoogleServiceAccountCredentials() : null

if (creds) {
  // Initialize Storage client
  storage = new Storage({
    projectId: googleProjectID,
    credentials: creds,
  })

  ragClient = new VertexRagServiceClient({
    project: googleProjectID,
    location: googleAIRegion,
    apiEndpoint: `${googleAIRegion}-aiplatform.googleapis.com`,
    credentials: creds,
  })
}

async function logQuestionToBucket(prompt: string, context: string, response?: string, error?: string) {
  if (!storage || !aiLogBucket) {
    console.warn('Storage not initialized or ai_log_bucket not set')
    return
  }

  try {
    const bucket = storage.bucket(aiLogBucket)
    const timestamp = new Date().toISOString()
    const fileName = `questions/${timestamp.replace(/:/g, '-')}-${Date.now()}.json`

    const logData = {
      timestamp,
      prompt,
      context,
      response,
      error,
    }

    const file = bucket.file(fileName)
    await file.save(JSON.stringify(logData, null, 2), {
      contentType: 'application/json',
      metadata: {
        timestamp,
      },
    })
  } catch (err) {
    console.error('Failed to log to bucket:', err)
  }
}

export async function POST(req: NextRequest) {
  // Return early if AI is not enabled
  if (!aiEnabled || !genAI) {
    return new Response(JSON.stringify({ error: 'AI suggestions are not enabled' }), { status: 503 })
  }

  // ensure we have a valid session
  const session = await auth()
  if (!session || !session.user?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const parsedBody = requestSchema.safeParse(await req.json().catch(() => null))
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid suggestions payload' }, { status: 400 })
    }
    const { section, prompt, context } = parsedBody.data
    let contextData = ''

    // Configure additional context for RAG if corpus ID is provided
    if (ragCorpusID) {
      contextData = await getContext(prompt, req.signal)
    }

    const systemInstruction = section === 'policy' ? `${aiSystemInstruction}\n${policySystemInstruction}` : `${aiSystemInstruction}\n${controlSystemInstruction}`

    const mergedUserText = [`Information Context (RAG):\n${toText(contextData)}`, `Request Context Details (authoritative):\n${toText(context)}`, `User Question:\n${prompt}`]
      .filter(Boolean)
      .join('\n\n')

    // get the response from the model
    const response = await genAI.models.generateContent({
      model: geminiModelName,
      contents: [
        {
          role: 'user',
          parts: [{ text: mergedUserText }],
        },
      ],
      config: {
        systemInstruction,
        temperature,
        maxOutputTokens,
        thinkingConfig: { thinkingBudget: 0 },
        abortSignal: req.signal,
      },
    })

    const text = response.text ?? 'No response generated.'

    if (response.candidates?.[0]?.finishReason !== FinishReason.STOP) {
      console.warn('response finished with reason:', response.candidates?.[0]?.finishReason)
    }

    try {
      await logQuestionToBucket(prompt, toText(context), text)
    } catch (loggingError) {
      console.log('Failed to log question to bucket:', loggingError)
    }

    return new Response(JSON.stringify({ text }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    const armorResponse = modelArmorErrorResponse(error)
    if (armorResponse) return armorResponse

    console.error('API Error:', error)
    return new Response(JSON.stringify({ error: 'Failed to get suggestions' }), { status: 500 })
  }
}

const getContext = async (prompt: string, signal: AbortSignal): Promise<string> => {
  const ragCorpus = `projects/${googleProjectID}/locations/${googleAIRegion}/ragCorpora/${ragCorpusID}`
  const parent = `projects/${googleProjectID}/locations/${googleAIRegion}`

  if (!ragClient) {
    return ''
  }

  const [response] = await ragClient.retrieveContexts({
    parent,
    query: {
      text: await sanitizePrompt(prompt, signal),
    },
    vertexRagStore: {
      ragResources: [{ ragCorpus: ragCorpus }],
    },
  })

  const chunks = response.contexts?.contexts ?? []

  return (
    chunks
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((c: any) => c && typeof c.text === 'string' && c.text.length > 0)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((c: any) => c.text)
      .join('\n\n')
  )
}

const toText = (v: unknown): string => {
  if (v == null) return 'None'
  if (typeof v === 'string') return v
  return String(v)
}
