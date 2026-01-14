import { AI_SYSTEM_INSTRUCTION, TEMPERATURE, MAX_OUTPUT_TOKENS, GEMINI_MODEL_NAME } from '@/constants/ai'
import { auth } from '@/lib/auth/auth'
import { Tool, VertexAI } from '@google-cloud/vertexai'
import { NextRequest, NextResponse } from 'next/server'

const AI_ENABLED = process.env.NEXT_PUBLIC_AI_SUGGESTIONS_ENABLED === 'true'

let vertexAI: VertexAI | null = null

// Initialize with credentials
if (AI_ENABLED && process.env.GOOGLE_AI_PROJECT_ID) {
  vertexAI = new VertexAI({
    project: process.env.GOOGLE_AI_PROJECT_ID || '',
    location: process.env.GOOGLE_AI_REGION,
    googleAuthOptions: {
      credentials: process.env.GOOGLE_CREDENTIALS ? JSON.parse(process.env.GOOGLE_CREDENTIALS) : undefined,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    },
  })
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

    // Configure tools for RAG if corpus ID is provided
    let tools: Tool[] = []
    if (process.env.GOOGLE_RAG_CORPUS_ID) {
      tools = [
        {
          retrieval: {
            vertexRagStore: {
              ragResources: [
                {
                  ragCorpus: `projects/${process.env.GOOGLE_AI_PROJECT_ID}/locations/${process.env.GOOGLE_AI_REGION}/ragCorpora/${process.env.GOOGLE_RAG_CORPUS_ID}`,
                },
              ],
            },
          },
        },
      ]
    }

    const model = vertexAI.getGenerativeModel({
      model: GEMINI_MODEL_NAME,
      generationConfig: {
        temperature: TEMPERATURE,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
      },
      systemInstruction: AI_SYSTEM_INSTRUCTION,
      tools: tools,
    })

    // Create streaming response
    const result = await model.generateContentStream({
      contents: [
        {
          role: 'user',
          parts: [{ text: context ? `${context}\n\n${prompt}` : prompt }],
        },
      ],
    })

    // Create a readable stream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text || ''
            controller.enqueue(encoder.encode(text))
          }
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('API Error:', error)
    return new Response(JSON.stringify({ error: 'Failed to get suggestions' }), { status: 500 })
  }
}
