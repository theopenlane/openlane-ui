import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')
  const fData = await fetch(`${process.env.API_REST_URL}/v1/verify?token=${token}`)

  if (fData.ok) {
    return NextResponse.json(await fData.json(), { status: 200 })
  }

  if (fData.status !== 200) {
    return NextResponse.json(await fData.json(), { status: fData.status })
  }
}
