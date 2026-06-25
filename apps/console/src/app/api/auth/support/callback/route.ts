import { type NextRequest, NextResponse } from 'next/server'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'

interface SupportCallbackRequest {
  code: string
  state: string
}

// Completes the second factor of the Openlane support access flow by forwarding the identity provider
// authorization code and state to the backend, which exchanges the code, enforces the configured domain
// restriction, and returns the support session token.
export async function POST(request: NextRequest) {
  try {
    const body: SupportCallbackRequest = await request.json()

    if (!body.code || !body.state) {
      return NextResponse.json({ success: false, message: 'code and state are required' }, { status: 400 })
    }

    const cookies = request.headers.get('cookie')
    const headers: HeadersInit = {
      ...(cookies ? { cookie: cookies } : {}),
    }

    const callbackData = await secureFetch(`${process.env.API_REST_URL}/v1/support/callback`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        code: body.code,
        state: body.state,
      }),
    })

    const callbackResponse = await callbackData.json()

    if (callbackData.ok && callbackResponse.success) {
      return NextResponse.json({ success: true, ...callbackResponse }, { status: 200 })
    }

    return NextResponse.json(
      {
        success: false,
        message: callbackResponse.error || 'Support callback failed',
      },
      { status: callbackData.status },
    )
  } catch (error) {
    console.error('Support callback API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error during support callback' }, { status: 500 })
  }
}
