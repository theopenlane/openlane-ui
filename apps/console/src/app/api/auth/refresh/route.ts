import { NextResponse } from 'next/server'
import { openlaneAPIUrl } from '@repo/dally/auth'

interface RefreshTokenResponse {
  access_token: string
  refresh_token: string
}

export async function POST(request: Request) {
  try {
    const { refresh_token } = await request.json()

    if (!refresh_token) {
      return NextResponse.json({ error: 'Missing refresh token' }, { status: 400 })
    }

    const response = await fetch(`${openlaneAPIUrl}/v1/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token }),
    })

    if (!response.ok) {
      console.error(`Refresh token failed with status: ${response.status}`)
      return NextResponse.json({ error: 'Failed to refresh token' }, { status: response.status })
    }

    const data: RefreshTokenResponse = await response.json()

    return NextResponse.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    })
  } catch (error) {
    console.error('Internal Server Error in token refresh:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
