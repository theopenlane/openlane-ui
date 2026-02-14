import { secureFetch } from '@/lib/auth/utils/secure-fetch'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Missing or invalid authorization header' }, { status: 401 })
    }

    const token = authHeader.substring(7)

    const response = await secureFetch(`${process.env.API_REST_URL}/questionnaire`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.error || 'Failed to fetch questionnaire',
        },
        { status: response.status },
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error fetching questionnaire:', error)
    return NextResponse.json({ success: false, message: 'An error occurred while fetching questionnaire' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Missing or invalid authorization header' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const body = await req.json()

    if (!body.data) {
      return NextResponse.json({ success: false, message: 'Missing data field in request body' }, { status: 400 })
    }

    const response = await secureFetch(`${process.env.API_REST_URL}/questionnaire`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ data: body.data, is_draft: body.isDraft ?? false }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.error || 'Failed to submit questionnaire',
        },
        { status: response.status },
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error submitting questionnaire:', error)
    return NextResponse.json({ success: false, message: 'An error occurred while submitting questionnaire' }, { status: 500 })
  }
}
