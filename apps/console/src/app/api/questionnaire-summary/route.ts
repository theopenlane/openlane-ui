import { auth } from '@/lib/auth/auth'
import { VertexAI, type Part, type TextPart } from '@google-cloud/vertexai'
import { NextRequest, NextResponse } from 'next/server'
import { aiEnabled, googleAPIKey, googleAIRegion, googleProjectID, geminiModelName } from '@repo/dally/ai'
import { z } from 'zod'

export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_QUESTIONS = 50
const MAX_RESPONSES = 200
const MAX_PROMPT_CHARS = 120_000
const MAX_STRING_LENGTH = 500
const MAX_ARRAY_ITEMS = 20
const MAX_OBJECT_KEYS = 20
const MAX_SANITIZE_DEPTH = 3

type SummaryResponse = {
  summary: string
  key_themes: string
  overall_sentiment: 'Positive' | 'Neutral' | 'Negative'
  sentiment_breakdown: {
    positive: number
    neutral: number
    negative: number
  }
}

const requestSchema = z.object({
  questions: z.array(z.object({ name: z.string(), title: z.string().optional(), type: z.string() })).max(MAX_QUESTIONS),
  responses: z.array(z.object({ answers: z.record(z.string(), z.unknown()) })).max(MAX_RESPONSES),
})

const summaryResponseSchema = z.object({
  summary: z.string(),
  key_themes: z.string(),
  overall_sentiment: z.enum(['Positive', 'Neutral', 'Negative']),
  sentiment_breakdown: z.object({
    positive: z.number(),
    neutral: z.number(),
    negative: z.number(),
  }),
})

let vertexAIClient: VertexAI | null | undefined

const truncateText = (value: string, maxLength: number = MAX_STRING_LENGTH): string => {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
}

const sanitizeValue = (value: unknown, depth = 0): unknown => {
  if (depth > MAX_SANITIZE_DEPTH) {
    return '[truncated]'
  }

  if (value == null || typeof value === 'boolean' || typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    return truncateText(value)
  }

  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_ITEMS).map((item) => sanitizeValue(item, depth + 1))
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).slice(0, MAX_OBJECT_KEYS)
    const cleaned: Record<string, unknown> = {}
    for (const [key, itemValue] of entries) {
      cleaned[key] = sanitizeValue(itemValue, depth + 1)
    }
    return cleaned
  }

  return truncateText(String(value))
}

const getVertexAI = (): VertexAI | null => {
  if (vertexAIClient !== undefined) {
    return vertexAIClient
  }

  if (!aiEnabled || !googleProjectID || !googleAPIKey) {
    vertexAIClient = null
    return vertexAIClient
  }

  try {
    const creds = JSON.parse(Buffer.from(googleAPIKey, 'base64').toString('utf8'))
    vertexAIClient = new VertexAI({
      project: googleProjectID,
      location: googleAIRegion,
      googleAuthOptions: {
        credentials: creds,
      },
    })
  } catch (error) {
    console.error('Questionnaire summary AI client initialization error:', error)
    vertexAIClient = null
  }

  return vertexAIClient
}

const parseModelSummary = (rawText: string): SummaryResponse | null => {
  const normalized = rawText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()

  const tryParse = (input: string): SummaryResponse | null => {
    try {
      const candidate = JSON.parse(input)
      const parsed = summaryResponseSchema.safeParse(candidate)
      return parsed.success ? (parsed.data as SummaryResponse) : null
    } catch {
      return null
    }
  }

  const direct = tryParse(normalized)
  if (direct) return direct

  const start = normalized.indexOf('{')
  const end = normalized.lastIndexOf('}')
  if (start >= 0 && end > start) {
    return tryParse(normalized.slice(start, end + 1))
  }

  return null
}

const extractResponseText = (parts: Part[] | undefined): string => {
  if (!parts || parts.length === 0) return ''

  const responseParts = parts.filter((part): part is TextPart => 'text' in part && typeof part.text === 'string' && !(part as unknown as Record<string, unknown>).thought)

  if (responseParts.length === 0) {
    const textParts = parts.filter((part): part is TextPart => 'text' in part && typeof part.text === 'string')
    return textParts.length > 0 ? textParts[textParts.length - 1].text : ''
  }

  return responseParts.map((part) => part.text).join('')
}

const buildPrompt = (questions: z.infer<typeof requestSchema>['questions'], responses: z.infer<typeof requestSchema>['responses']): string => {
  const promptPayload = {
    questions: questions.map((question) => ({
      name: truncateText(question.name, 120),
      title: truncateText(question.title ?? question.name, 300),
      type: truncateText(question.type, 80),
    })),
    responses: responses.map((response, index) => ({
      respondent: `R${index + 1}`,
      answers: sanitizeValue(response.answers),
    })),
  }

  const serializedPayload = JSON.stringify(promptPayload, null, 2)
  if (serializedPayload.length > MAX_PROMPT_CHARS) {
    throw new Error('PROMPT_TOO_LARGE')
  }

  return `Questionnaire data:\n${serializedPayload}`
}

const badRequest = (error: string) =>
  NextResponse.json(
    {
      error,
    },
    { status: 400 },
  )

const SYSTEM_PROMPT = `You are an AI assistant that analyzes questionnaire responses. Given a set of questions and their corresponding responses from multiple respondents, provide:

1. A concise summary of the overall findings
2. Key themes identified across responses
3. An overall sentiment classification

Rules for sentiment:
- "Positive" if responses generally indicate satisfaction, agreement, or favorable outcomes
- "Neutral" if responses are mixed or informational without strong sentiment
- "Negative" if responses generally indicate dissatisfaction, disagreement, or unfavorable outcomes

Respond ONLY with valid JSON in this exact format:
{
  "summary": "A 2-3 sentence summary of the findings",
  "key_themes": "A 1-2 sentence description of the main themes",
  "overall_sentiment": "Positive|Neutral|Negative",
  "sentiment_breakdown": {
    "positive": <number 0-100>,
    "neutral": <number 0-100>,
    "negative": <number 0-100>
  }
}`

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const vertexAI = getVertexAI()
  if (!aiEnabled || !vertexAI) {
    return NextResponse.json({ error: 'AI features are not enabled' }, { status: 503 })
  }

  try {
    const body = await req.json().catch(() => null)
    if (!body) {
      return badRequest('Invalid JSON body')
    }

    const parsedBody = requestSchema.safeParse(body)
    if (!parsedBody.success) {
      return badRequest('Invalid questionnaire summary payload')
    }

    const userPrompt = buildPrompt(parsedBody.data.questions, parsedBody.data.responses)

    const model = vertexAI.getGenerativeModel({
      model: geminiModelName,
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      },
      systemInstruction: SYSTEM_PROMPT,
    })

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
    })

    const response = await result.response
    const text = extractResponseText(response.candidates?.[0]?.content?.parts)
    const summary = parseModelSummary(text)

    if (!summary) {
      return NextResponse.json({ error: 'Failed to parse summary output' }, { status: 502 })
    }

    return NextResponse.json(summary, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'PROMPT_TOO_LARGE') {
      return NextResponse.json({ error: 'Questionnaire payload is too large to summarize' }, { status: 413 })
    }
    console.error('Questionnaire summary API error:', error)
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
  }
}
