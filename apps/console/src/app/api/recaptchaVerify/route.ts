import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ success: false, message: 'Token is required' }, { status: 400 })
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY

    // Verify the reCAPTCHA token with Google
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey || '',
        response: token,
      }),
    })

    const data = await response.json()

    if (data.success && data.score >= 0.2) {
      return NextResponse.json({ success: true, score: data.score, action: data.action })
    } else {
      console.log('reCAPTCHA verification failed:', data)

      return NextResponse.json(
        {
          success: false,
          message: 'Verification failed',
          errors: data['error-codes'],
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
