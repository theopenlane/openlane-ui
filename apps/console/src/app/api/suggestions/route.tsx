import { AI_SYSTEM_INSTRUCTION, TEMPERATURE, MAX_OUTPUT_TOKENS, GEMINI_MODEL_NAME } from '@/constants/ai'
import { auth } from '@/lib/auth/auth'
import { Tool, VertexAI } from '@google-cloud/vertexai'
import { NextRequest, NextResponse } from 'next/server'
import { VertexRagServiceClient } from '@google-cloud/aiplatform'
import { Storage } from '@google-cloud/storage'

const AI_ENABLED = process.env.NEXT_PUBLIC_AI_SUGGESTIONS_ENABLED === 'true'

let vertexAI: VertexAI | null = null
let storage: Storage | null = null

const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_B64 as string
const json = Buffer.from(b64, 'base64').toString('utf8')
const creds = JSON.parse(json)

// Initialize with credentials
if (AI_ENABLED && process.env.GOOGLE_AI_PROJECT_ID) {
  vertexAI = new VertexAI({
    project: process.env.GOOGLE_AI_PROJECT_ID || '',
    location: process.env.GOOGLE_AI_REGION,
    googleAuthOptions: {
      credentials: creds,
    },
  })

  // Initialize Storage client
  storage = new Storage({
    projectId: process.env.GOOGLE_AI_PROJECT_ID,
    credentials: creds,
  })
}

async function logQuestionToBucket(prompt: string, context: string, response?: string, error?: string) {
  if (!storage || !process.env.GCS_LOG_BUCKET) {
    console.warn('Storage not initialized or GCS_LOG_BUCKET not set')
    return
  }

  try {
    const bucket = storage.bucket(process.env.GCS_LOG_BUCKET)
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
    console.error('Failed to log to GCS bucket:', err)
  }
}

export async function POST(req: NextRequest) {
  // Return early if AI is not enabled
  if (!AI_ENABLED || !vertexAI) {
    return new Response(JSON.stringify({ error: 'AI suggestions are not enabled' }), { status: 503 })
  }

  // ensure we have a valid session
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { prompt, context } = await req.json()
    let contextData = ''

    // Configure additional context for RAG if corpus ID is provided
    const tools: Tool[] = []
    if (process.env.GOOGLE_RAG_CORPUS_ID) {
      contextData = await getContext(prompt)
    }

    const model = vertexAI.getGenerativeModel({
      model: GEMINI_MODEL_NAME,
      generationConfig: {
        temperature: TEMPERATURE,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
      },
      systemInstruction: AI_SYSTEM_INSTRUCTION,
      tools,
    })

    // Your env var text stays untouched:
    const RULES = process.env.AI_SYSTEM_INSTRUCTION ?? '' // whatever you already have

    const mergedUserText = [
      RULES, // unchanged
      `Information Context (RAG):\n${toText(contextData)}`,
      `Request Context Details (authoritative):\n${toText(context)}`,
      `User Question:\n${prompt}`,
    ]
      .filter(Boolean)
      .join('\n\n')

    // get the response from the model
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: mergedUserText }],
        },
      ],
    })

    const response = await result.response

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response generated.'

    if (response.candidates?.[0]?.finishReason != 'STOP') {
      console.warn('response finished with reason:', response.candidates?.[0]?.finishReason)
    }

    await logQuestionToBucket(prompt, context, text)

    return new Response(JSON.stringify({ text }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('API Error:', error)
    return new Response(JSON.stringify({ error: 'Failed to get suggestions' }), { status: 500 })
  }
}

async function getContext(prompt: string): Promise<string> {
  const ragCorpus = `projects/${process.env.GOOGLE_AI_PROJECT_ID}/locations/${process.env.GOOGLE_AI_REGION}/ragCorpora/${process.env.GOOGLE_RAG_CORPUS_ID}`

  const ragClient = new VertexRagServiceClient({
    project: process.env.GOOGLE_AI_PROJECT_ID,
    location: process.env.GOOGLE_AI_REGION,
    apiEndpoint: `${process.env.GOOGLE_AI_REGION}-aiplatform.googleapis.com`,
    credentials: creds,
  })

  const parent = `projects/${process.env.GOOGLE_AI_PROJECT_ID}/locations/${process.env.GOOGLE_AI_REGION}`

  const [response] = await ragClient.retrieveContexts({
    parent,
    query: {
      text: prompt,
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
