import { openlaneGQLUrl } from '@repo/dally/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { query, variables } = await request.json()

  if (!process.env.OPENLANE_API_WRITE_TOKEN) {
    const errorResponse = {
      errors: [
        {
          message: 'OPENLANE_API_WRITE_TOKEN is not set in environment variables.',
        },
      ],
    }
    return new NextResponse(JSON.stringify(errorResponse), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const graphqlResponse = await fetch(openlaneGQLUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENLANE_API_WRITE_TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  })

  const data = await graphqlResponse.json()

  if (!graphqlResponse.ok) {
    return NextResponse.json(data, { status: graphqlResponse.status })
  }

  return NextResponse.json(data, { status: 200 })
}
