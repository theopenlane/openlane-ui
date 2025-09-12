import { type NextRequest, NextResponse } from 'next/server'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const email = searchParams.get('email')

  const fData = await secureFetch(`${process.env.API_REST_URL}/.well-known/webfinger?resource=acct:${email}`, {
    method: 'GET',
  })

  const fetchedData = await fData.json()

  if (fData.ok) {
    return NextResponse.json(fetchedData, { status: 200 })
  }

  return NextResponse.json(fetchedData, { status: fData.status })
}
