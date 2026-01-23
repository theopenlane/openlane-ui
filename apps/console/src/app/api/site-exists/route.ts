import { SiteExistsRequest, SiteExistsResponse } from '@/types/site-exists'
import { NextResponse } from 'next/server'

async function siteExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'GET' })

    return response.ok
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as SiteExistsRequest
  if (!body.url) {
    const response: SiteExistsResponse = {
      exists: false,
      error: 'Invalid URL',
    }
    return NextResponse.json(response, { status: 400 })
  }
  const response: SiteExistsResponse = {
    exists: await siteExists(body.url),
  }

  return NextResponse.json(response)
}
