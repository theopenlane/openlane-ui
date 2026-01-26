import { auth } from '@/lib/auth/auth'
import { bedrock } from '@ai-sdk/amazon-bedrock'
import { createEdgeRuntimeAPI } from '@assistant-ui/react/edge'
import { bedrockModelArn, enableChat } from '@repo/dally/chat'
import { NextResponse } from 'next/server'

const modelID = bedrockModelArn || ''

const edgeAPI = createEdgeRuntimeAPI({
  model: bedrock(modelID),
})

export async function POST(req: Request) {
  if (!enableChat || !process.env.AWS_REGION) {
    return NextResponse.json({ error: 'Chat is not enabled' }, { status: 503 })
  }

  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  return edgeAPI.POST(req)
}
