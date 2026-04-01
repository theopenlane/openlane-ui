import { auth } from '@/lib/auth/auth'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'
import { openlaneAPIUrl } from '@repo/dally/auth'
import { type NextRequest, NextResponse } from 'next/server'
import { parseProxyResponse } from '../proxy-response'

type ConfigRequestBody = {
  definitionId?: string
  installationId?: string
  credentialRef?: string
  body?: Record<string, unknown>
  userInput?: Record<string, unknown>
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const token = session?.user?.accessToken

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = (await request.json()) as ConfigRequestBody
    const definitionId = payload.definitionId?.trim()

    if (!definitionId) {
      return NextResponse.json({ error: 'Definition ID is required' }, { status: 400 })
    }

    const upstreamResponse = await secureFetch(`${openlaneAPIUrl}/v1/integrations/${encodeURIComponent(definitionId)}/config`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        installationId: payload.installationId,
        credentialRef: payload.credentialRef,
        body: payload.body ?? {},
        userInput: payload.userInput ?? {},
      }),
    })

    const rawBody = await upstreamResponse.text()
    return parseProxyResponse(rawBody, upstreamResponse.status, upstreamResponse.ok, `Failed to configure ${definitionId}`)
  } catch (error) {
    console.error('Error configuring integration:', error)
    return NextResponse.json({ error: 'An error occurred while configuring integration' }, { status: 500 })
  }
}
