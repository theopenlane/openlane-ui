import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'

export async function POST(request: NextRequest) {
  try {
    // Parse the OTP from the request body
    const otp = await request.json()

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
      Authorization: `Bearer ${token}`,
    }

    // Make the request to the external API
    const response = await secureFetch(`${process.env.API_REST_URL}/v1/2fa/validate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(otp),
    })

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
