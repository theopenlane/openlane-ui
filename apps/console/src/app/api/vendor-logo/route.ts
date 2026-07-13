import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { VENDOR_LOGO_DOMAIN_REGEX, VENDOR_LOGO_SIZE } from '@/lib/vendor-logo'

const FAVICON_ENDPOINT = 'https://www.google.com/s2/favicons'

export async function GET(req: Request) {
  const session = await auth()

  if (!session || !session.user?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const domain = searchParams.get('domain')?.trim().toLowerCase()
  const requestedSize = Math.floor(Number(searchParams.get('sz')))
  const size = Number.isFinite(requestedSize) ? Math.min(Math.max(requestedSize, VENDOR_LOGO_SIZE.min), VENDOR_LOGO_SIZE.max) : VENDOR_LOGO_SIZE.default

  if (!domain || !VENDOR_LOGO_DOMAIN_REGEX.test(domain)) {
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
