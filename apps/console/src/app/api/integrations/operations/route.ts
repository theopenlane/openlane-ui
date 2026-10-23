import { coreAPIRequestWithBody, HTTP_METHODS } from '@/lib/auth/utils/core-api-request'
import { type NextRequest, NextResponse } from 'next/server'

type RunOperationRequestBody = {
  integrationId?: string
  operation?: string
  config?: Record<string, unknown>
}

export const POST = async (request: NextRequest) => {
  let payload: RunOperationRequestBody
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const integrationId = payload.integrationId?.trim()
  const operation = payload.operation?.trim()

  if (!integrationId || !operation) {
    return NextResponse.json({ error: 'Integration ID and operation are required' }, { status: 400 })
  }

  return coreAPIRequestWithBody(
    `/v1/integrations/${encodeURIComponent(integrationId)}/operations/run`,
    HTTP_METHODS.POST,
    { body: { operation, config: payload.config } },
    `Operation ${operation} failed for ${integrationId}`,
  )
}
