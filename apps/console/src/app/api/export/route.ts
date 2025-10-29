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

    const fData = await secureFetch(`${process.env.API_REST_URL}/example/csv`, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyData),
      credentials: 'include',
    })

    if (!fData.ok) {
      const text = await fData.text()
      try {
        const json = JSON.parse(text)
        return NextResponse.json(json, { status: fData.status })
      } catch {
        return NextResponse.json({ message: text || 'Failed to export' }, { status: fData.status })
      }
    }

    const blob = await fData.blob()
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${bodyData.filename}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
