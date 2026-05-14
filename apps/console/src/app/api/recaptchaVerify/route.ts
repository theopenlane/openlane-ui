import { verifyRecaptchaToken } from '@/lib/recaptcha'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (typeof token !== 'string' || token.length === 0) {
      return NextResponse.json({ success: false, message: 'Token is required' }, { status: 400 })
    }

    const result = await verifyRecaptchaToken(token)

    if (result.success) {
      return NextResponse.json({ success: true, score: result.score })
    }

    return NextResponse.json({ success: false, message: 'Verification failed' }, { status: 400 })
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
