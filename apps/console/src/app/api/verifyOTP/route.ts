import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'

export async function POST(request: NextRequest) {
  try {
    // Parse the OTP from the request body
    const { otp } = await request.json()

    // Ensure the OTP is provided
    if (!otp) {
      return NextResponse.json({ success: false, message: 'OTP is required' }, { status: 400 })
    }

    // Retrieve the user's session and token
    const session = await auth()
    const token = session?.user?.accessToken

    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication token is missing' }, { status: 401 })
    }

    // Add the token to the headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }
    console.log('token', token)
    console.log('OTP:', otp)
    console.log('Request body:', JSON.stringify({ totp_code: otp }))

    // Make the request to the external API
    const response = await fetch(`${process.env.API_REST_URL}/v1/2fa/validate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ totp_code: otp }),
    })

    console.log('response', response)

    const data = await response.json()

    // Check if the external API response is successful
    if (response.ok && data.success) {
      return NextResponse.json({ success: true, message: 'OTP validated successfully', data })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: data.message || 'OTP validation failed',
          errors: data['error-codes'] || [],
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error('Error verifying OTP:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
