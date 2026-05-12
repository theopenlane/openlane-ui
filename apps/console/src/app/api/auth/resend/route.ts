import { verifyRecaptchaToken } from '@/lib/recaptcha'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const bodyData = await request.json()

  if (!bodyData.recaptchaToken) {
    return NextResponse.json({ error: 'Missing recaptchaToken' }, { status: 400 })
  }

  const recaptcha = await verifyRecaptchaToken(bodyData.recaptchaToken)
  if (!recaptcha.success) {
    return NextResponse.json({ error: 'reCAPTCHA verification failed' }, { status: 400 })
  }

  const { recaptchaToken: _, ...payload } = bodyData

  const fData = await secureFetch(`${process.env.API_REST_URL}/v1/resend`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  if (fData.ok) {
    return NextResponse.json(await fData.json(), { status: 200 })
  }

  if (fData.status !== 201) {
    return NextResponse.json(await fData.json(), { status: fData.status })
  }
}
