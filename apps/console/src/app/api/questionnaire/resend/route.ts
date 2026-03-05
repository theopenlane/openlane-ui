import { secureFetch } from '@/lib/auth/utils/secure-fetch'
import { type NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.assessment_id || !body.email) {
      return NextResponse.json({ success: false, message: 'Missing assessment_id or email' }, { status: 400 })
    }

    const response = await secureFetch(`${process.env.API_REST_URL}/questionnaire/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assessment_id: body.assessment_id,
        email: body.email,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.error || 'Failed to resend questionnaire link',
        },
        { status: response.status },
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error resending questionnaire link:', error)
    return NextResponse.json({ success: false, message: 'An error occurred while resending questionnaire link' }, { status: 500 })
  }
}
