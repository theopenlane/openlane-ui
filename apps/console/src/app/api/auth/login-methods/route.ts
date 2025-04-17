import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ success: false, message: 'username/email is required' }, { status: 400 })
    }

    // Retrieve the user's session and token
    const session = await auth()
    const token = session?.user?.accessToken

    if (token) {
      return NextResponse.json({ success: false, message: 'You are already authenticated' }, { status: 401 })
    }

    // Make the request to the external API
    const response = await fetch(`${process.env.API_REST_URL}/v1/login/methods`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ username: email }),
    })

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json(data, { status: 200 })
    }

    return NextResponse.json(
      {
        success: false,
        message: data.message || 'Could not fetch the available auth methods for this user',
        errors: data['error-codes'] || [],
      },
      { status: 400 },
    )
  } catch (error) {
    console.error('Error fetching user available auth methods', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
