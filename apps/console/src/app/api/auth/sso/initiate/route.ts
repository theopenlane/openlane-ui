import { type NextRequest, NextResponse } from 'next/server'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'
import { parseAndSetResponseCookies } from '@/lib/auth/utils/parse-response-cookies'

interface SSOInitiateRequest {
  slug: string
}

// proxies the public, slug-keyed SSO initiation endpoint so the backend's state/nonce/organization_id
// cookies are re-set on the UI origin, allowing the existing /login/sso callback page to complete the flow
export async function POST(request: NextRequest) {
  try {
    const body: SSOInitiateRequest = await request.json()

    if (!body.slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 })
    }

    const ssoData = await secureFetch(`${process.env.API_REST_URL}/v1/orgs/${encodeURIComponent(body.slug)}/sso`, {
      method: 'GET',
    })

    const fetchedData = await ssoData.json()

    if (ssoData.ok && fetchedData.success) {
      const response = NextResponse.json(fetchedData, { status: ssoData.status })

      const responseCookies = ssoData.headers.get('set-cookie')
      if (responseCookies) {
        parseAndSetResponseCookies(response, responseCookies)
      }

      return response
    }

    if (ssoData.ok && fetchedData.success === false) {
      return NextResponse.json(
        {
          success: false,
          message: fetchedData.error || 'SSO initiation failed',
        },
        { status: 400 },
      )
    }

    return NextResponse.json(fetchedData, { status: ssoData.status })
  } catch (error) {
    console.error('SSO initiate error:', error)
    return NextResponse.json({ success: false, message: 'Could not start SSO' }, { status: 500 })
  }
}
