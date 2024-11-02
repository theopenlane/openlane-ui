import { openlaneGQLUrl } from '@repo/dally/auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const bodyData = await request.json()

  const fData = await fetch(
    openlaneGQLUrl,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(bodyData),
      credentials: 'include',
    },
  )

  const data = await fData.json()

  if (fData.ok) {
    return NextResponse.json(data, { status: 200 })
  }

  if (fData.status !== 201) {
    return NextResponse.json(data, { status: fData.status })
  }
}
