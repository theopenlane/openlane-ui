import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { setSessionCookie } from '@/lib/auth/utils/set-session-cookie'
import { csrfHeader } from '@repo/dally/auth'
import { getCSRFCookie } from '@/lib/auth/utils/set-csrf-cookie'
import { parseAndSetResponseCookies } from '@/lib/auth/utils/parse-response-cookies'
import { describeCredential, selectCoreCredential } from '@/lib/auth/utils/select-core-credential'

export async function POST(request: Request) {
  const session = await auth()
  const authorization = request.headers.get('authorization')
  const selection = selectCoreCredential(session, authorization)

  if (selection.kind === 'rejected') {
    console.error('[switch-organization] refusing to forward a credential', JSON.stringify({ userId: session?.user?.userId, credential: describeCredential(session, authorization, selection) }))

    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const token = selection.accessToken

  const bodyData = await request.json()
  const cookies = request.headers.get('cookie')

  const headers: HeadersInit = {
    'content-type': 'application/json',
    Authorization: `Bearer ${token}`,
  }

  if (cookies) {
    headers['cookie'] = cookies
  }

  const csrfToken = await getCSRFCookie(cookies)
  if (csrfToken) {
    headers[csrfHeader] = csrfToken
  }

  const fData = await fetch(`${process.env.API_REST_URL}/v1/switch`, {
    method: 'POST',
    headers,
    body: JSON.stringify(bodyData),
    credentials: 'include',
  })

  const fetchedData = await fData.json()

  if (fData.ok) {
    setSessionCookie(fetchedData.session)

    const response = NextResponse.json(fetchedData, { status: 200 })

    const responseCookies = fData.headers.get('set-cookie')
    if (responseCookies) {
      parseAndSetResponseCookies(response, responseCookies)
    }

    return response
  }

  if (fData.status !== 201) {
    return NextResponse.json(fetchedData, { status: fData.status })
  }
}
