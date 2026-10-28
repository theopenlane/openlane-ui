import { NextResponse, type NextRequest } from 'next/server'
import { sessionEventSchema } from '@/lib/auth/utils/session-event'
import { logSessionEvent } from '@/lib/auth/utils/session-log'

const SESSION_COOKIE_MARKER = 'authjs.session-token'

export const POST = async (request: NextRequest) => {
  const parsed = sessionEventSchema.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid session event' }, { status: 400 })
  }

  const { verdict, clientTime, ...detail } = parsed.data

  logSessionEvent('warn', `client ${verdict}`, {
    ...detail,
    clientClockAheadMs: clientTime - Date.now(),
    sessionCookies: request.cookies
      .getAll()
      .map((cookie) => cookie.name)
      .filter((name) => name.includes(SESSION_COOKIE_MARKER)),
    userAgent: request.headers.get('user-agent'),
  })

  return new NextResponse(null, { status: 204 })
}
