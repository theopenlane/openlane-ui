import { setCSRFCookie } from '@/lib/auth/utils/set-csrf-cookie'
import { csrfHeader } from '@repo/dally/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const fData = await fetch(`${process.env.API_REST_URL}/csrf`)

  const data = await fData.json()

  const response = NextResponse.json(data, {
    status: fData.status,
  })

  setCSRFCookie(data.csrf)
  response.headers.set(csrfHeader, data.csrf)

  return response ?? ''
}
