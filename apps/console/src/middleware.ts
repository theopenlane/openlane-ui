import { NextResponse } from 'next/server'
import { auth } from './lib/auth/auth'
import { cookies } from 'next/headers'
import { sessionCookieName } from '@repo/dally/auth'
import { getToken } from 'next-auth/jwt'

export default auth(async (req) => {
  // Attach `next-url` header for client-side route metadata
  req.headers.append('next-url', req.nextUrl.toString())

  let hasSessionCookie = true

  if (sessionCookieName) {
    const sessionData = cookies().get(sessionCookieName)
    if (!sessionData || !sessionData.value) {
      hasSessionCookie = false
    }
  }
  const session = await auth()
  console.log('session', session)

  let token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || '', cookieName: '__Secure-authjs.session-token' })
  console.log('token1', token)

  token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || '', cookieName: sessionCookieName })
  console.log('token2', token)

  const isTfaEnabled = session?.user.isTfaEnabled

  if (req.auth?.user && hasSessionCookie) {
    if (isTfaEnabled) {
      return NextResponse.redirect(new URL('/tfa', req.url))
    }
    return NextResponse.next()
  }

  return NextResponse.redirect(new URL('/login', req.url))
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public/backgrounds (background images)
     * - public/icons (images)
     * and the following unprotected pages:
     * - login (login page)
     * - verify (verify page)
     * - resend-verify (resend verify page)
     * - waitlist (waitlist page)
     * - invite (invite verify page)
     */

    //IF YOU ADD PUBLIC PAGE, ITS REQUIRED TO CHANGE IT IN Providers.tsx
    '/((?!api|[_next/static]|[_next/image]|favicon.ico|backgrounds|backgrounds/|icons|icons/|login|verify|resend-verify|waitlist|subscriber-verify|invite|tfa).*)',
  ],
}
