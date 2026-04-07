import { NextResponse } from 'next/server'

export function parseProxyResponse(rawBody: string, status: number, ok: boolean, fallbackError: string): NextResponse<unknown> {
  try {
    const payload = JSON.parse(rawBody) as unknown
    return NextResponse.json(payload, { status })
  } catch {
    if (ok) {
      return NextResponse.json({ error: `Invalid JSON in upstream response` }, { status: 500 })
    }

    return NextResponse.json({ error: rawBody || fallbackError }, { status })
  }
}

export function appendSetCookieHeaders(upstreamHeaders: Headers, response: NextResponse<unknown>) {
  for (const cookie of readSetCookieHeaders(upstreamHeaders)) {
    response.headers.append('Set-Cookie', cookie)
  }
}

function readSetCookieHeaders(headers: Headers): string[] {
  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie()
  }

  const header = headers.get('set-cookie')
  if (!header) {
    return []
  }

  return header.split(/,\s*(?=[^;,\s]+=)/)
}
