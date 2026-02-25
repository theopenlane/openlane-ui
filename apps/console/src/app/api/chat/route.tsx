import { auth } from '@/lib/auth/auth'
import { bedrock } from '@ai-sdk/amazon-bedrock'
import { bedrockModelArn, enableChat } from '@repo/dally/chat'
import { convertToModelMessages, streamText } from 'ai'
import { NextResponse } from 'next/server'

export const maxDuration: number = 30

const modelID: string = bedrockModelArn || 'anthropic.claude-3-5-sonnet-20240620-v1:0'

export async function POST(req: Request) {
  if (!enableChat || !process.env.AWS_REGION) {
    return NextResponse.json({ error: 'Chat is not enabled' }, { status: 503 })
  }

  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { messages } = await req.json()

  const result = streamText({
    model: bedrock(modelID),
    messages: await convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}
