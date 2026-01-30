import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'

export async function POST(request: Request) {
  try {
    const bodyData = await request.json()
    const session = await auth()
    const token = session?.user?.accessToken

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
    }

    // request snapshot from backend API server, which will return a base64 image
    const response = await secureFetch(`${process.env.API_REST_URL}/v1/snapshot`, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyData),
      credentials: 'include',
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.error || 'Failed to submit snapshot request',
        },
        { status: response.status },
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error submitting snapshot request:', error)
    return NextResponse.json({ success: false, message: 'An error occurred while submitting snapshot request' }, { status: 500 })
  }
}
