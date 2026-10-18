import { type NextRequest, NextResponse } from 'next/server'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'
import { parseAndSetResponseCookies } from '@/lib/auth/utils/parse-response-cookies'
import { resolveSSOOrganizationId } from '@/lib/auth/utils/webfinger'
import { isValidEmail } from '@/lib/validators'

const SSO_LOGIN_PATH = '/v1/sso/login'

interface SSOLoginRequest {
  organization_id?: string
  email?: string
  is_test?: boolean
}

const resolveOrganizationId = async ({ organization_id, email }: SSOLoginRequest): Promise<string | null> => {
  if (typeof organization_id === 'string' && organization_id) {
    return organization_id
  }

  return typeof email === 'string' && isValidEmail(email) ? resolveSSOOrganizationId(email) : null
}

// is_test cookie is for sso being tested before enforcement

export async function POST(request: NextRequest) {
  try {
    const body: SSOLoginRequest = await request.json()
    const organizationId = await resolveOrganizationId(body)

    if (!organizationId) {
      return NextResponse.json({ success: false, message: 'SSO is not available for this account' }, { status: 400 })
    }

    const ssoData = await secureFetch(`${process.env.API_REST_URL}${SSO_LOGIN_PATH}`, {
      method: 'POST',
      body: JSON.stringify({
        organization_id: organizationId,
        ...(body.is_test !== undefined && { is_test: body.is_test }),
      }),
    })

    const fetchedData = await ssoData.json()

    if (ssoData.ok && fetchedData.success) {
      const response = NextResponse.json(fetchedData, { status: ssoData.status })

      const responseCookies = ssoData.headers.get('set-cookie')
      if (responseCookies) {
        // ignore other cookies
        // old csrf token was being stored again in csrf cookies
        // thus making secureFetch in sso/callback/route ignore fetching a new one
        parseAndSetResponseCookies(response, responseCookies)
      }

      return response
    }

    if (ssoData.ok && fetchedData.success === false) {
      return NextResponse.json(
        {
          success: false,
          message: fetchedData.error || 'SSO login failed',
        },
        { status: 400 },
      )
    }

    return NextResponse.json(fetchedData, { status: ssoData.status })
  } catch (error) {
    console.error('SSO login error:', error)
    return NextResponse.json({ success: false, message: 'Could not login with SSO' }, { status: 500 })
  }
}
