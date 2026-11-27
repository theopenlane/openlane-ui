import { auth } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'
import { serverSecureFetch } from '@/lib/server/core-fetch'
import { parseAndSetResponseCookies } from '@/lib/auth/utils/parse-response-cookies'

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ssoData = await serverSecureFetch(`${process.env.API_REST_URL}/v1/sso/test`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`,
      },
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
          message: fetchedData.error || 'SSO test failed',
        },
        { status: 400 },
      )
    }

    return NextResponse.json(fetchedData, { status: ssoData.status })
  } catch (error) {
    console.error('SSO test error:', error)
    return NextResponse.json({ success: false, message: 'Could not start SSO test' }, { status: 500 })
  }
}
