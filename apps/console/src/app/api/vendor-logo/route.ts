import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'

const FAVICON_ENDPOINT = 'https://www.google.com/s2/favicons'
const DEFAULT_SIZE = 128
const MIN_SIZE = 16
const MAX_SIZE = 256
const DOMAIN_REGEX = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/

export async function GET(req: Request) {
  const session = await auth()

  if (!session || !session.user?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const domain = searchParams.get('domain')?.trim().toLowerCase()
  const size = Math.min(Math.max(Number(searchParams.get('sz')) || DEFAULT_SIZE, MIN_SIZE), MAX_SIZE)

  if (!domain || !DOMAIN_REGEX.test(domain)) {
    return NextResponse.json({ error: 'Invalid domain' }, { status: 400 })
  }

  const faviconUrl = `${FAVICON_ENDPOINT}?domain=${encodeURIComponent(domain)}&sz=${size}`

  try {
    const response = await fetch(faviconUrl)

    if (!response.ok) {
      return NextResponse.json({ error: 'Logo not found' }, { status: 404 })
    }

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        'content-type': response.headers.get('content-type') ?? 'image/png',
        'cache-control': 'private, max-age=86400',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch logo' }, { status: 502 })
  }
}
