import { setCSRFCookie } from '@/lib/auth/utils/set-csrf-cookie'
import { NextResponse } from 'next/server'

export async function GET() {
  const fData = await fetch(`${process.env.API_REST_URL}/csrf`)

  const data = await fData.json()

  console.log('CSRF data:', data)

  const response = NextResponse.json(data, {
    status: fData.status,
  })

  setCSRFCookie(data.csrf)

  console.log('CSRF cookie set:', data.csrf)

  return response ?? ''
}
