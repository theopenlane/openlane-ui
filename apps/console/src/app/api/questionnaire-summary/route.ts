import { auth } from '@/lib/auth/auth'
import { VertexAI } from '@google-cloud/vertexai'
import { NextRequest, NextResponse } from 'next/server'
import { aiEnabled, googleAPIKey, googleAIRegion, googleProjectID, geminiModelName } from '@repo/dally/ai'

export const runtime = 'nodejs'
export const maxDuration = 60

let vertexAI: VertexAI | null = null

if (aiEnabled && googleProjectID && googleAPIKey) {
  const b64 = googleAPIKey
  const json = Buffer.from(b64, 'base64').toString('utf8')
  const creds = JSON.parse(json)

  vertexAI = new VertexAI({
    project: googleProjectID,
    location: googleAIRegion,
    googleAuthOptions: {
      credentials: creds,
    },
  })
}

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
  "overall_sentiment": "Positive" | "Neutral" | "Negative",
  "sentiment_breakdown": {
    "positive": <number 0-100>,
    "neutral": <number 0-100>,
    "negative": <number 0-100>
  }
}`

export async function POST(req: NextRequest) {
  if (!aiEnabled || !vertexAI) {
    return new Response(JSON.stringify({ error: 'AI features are not enabled' }), { status: 503 })
  }

  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { questions, responses } = await req.json()

    const model = vertexAI.getGenerativeModel({
      model: geminiModelName,
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 1024,
      },
      systemInstruction: SYSTEM_PROMPT,
    })

    const userPrompt = `Questions:\n${JSON.stringify(questions, null, 2)}\n\nResponses:\n${JSON.stringify(responses, null, 2)}`

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
    })

    const response = await result.response
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'

    const cleanText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()
    const parsed = JSON.parse(cleanText)

    return new Response(JSON.stringify(parsed), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Questionnaire summary API error:', error)
    return new Response(JSON.stringify({ error: 'Failed to generate summary' }), { status: 500 })
  }
}
