import { secureFetch } from '@/lib/auth/utils/secure-fetch'
import { useInsecureCookies } from '@repo/dally/auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const bodyData = await request.json()

  const fData = await secureFetch(`${process.env.API_REST_URL}/v1/register`, {
    method: 'POST',
    body: JSON.stringify(bodyData),
  })

  if (fData.ok) {
    const response = NextResponse.json(await fData.json(), { status: 200 })
    response.cookies.set('passkey-prompt', 'true', {
      maxAge: 10 * 60,
      path: '/',
      sameSite: 'lax',
      secure: !useInsecureCookies,
    })

    return response
  }

  if (fData.status !== 201) {
    return NextResponse.json(await fData.json(), { status: fData.status })
  }
}
