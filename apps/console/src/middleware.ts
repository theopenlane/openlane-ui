import { NextResponse } from 'next/server'
import { auth } from './lib/auth/auth'
import { cookies } from 'next/headers'
import { sessionCookieName } from '@repo/dally/auth'

export default auth(async (req) => {
  // Attach `next-url` header for client-side route metadata
  req.headers.append('next-url', req.nextUrl.toString())

  //IF YOU ADD PUBLIC PAGE, ITS REQUIRED TO CHANGE IT IN Providers.tsx
  const publicPages = ['/login', '/tfa', '/invite', '/subscriber-verify', '/verify', '/resend-verify', '/waitlist']

  const path = req.nextUrl.pathname
  const isPublicPage = publicPages.includes(path)

  const isInvite = path.startsWith('/invite')

  let hasSessionCookie = true

  if (sessionCookieName) {
    const sessionData = (await cookies()).get(sessionCookieName)
    if (!sessionData || !sessionData.value) {
      hasSessionCookie = false
    }
  }
  const session = await auth()

  const isLoggedIn = req.auth?.user && hasSessionCookie
  const isTfaEnabled = session?.user.isTfaEnabled
  const isOnboarding = session?.user.isOnboarding

  if (!isLoggedIn) {
    return isPublicPage ? NextResponse.next() : NextResponse.redirect(new URL('/login', req.url))
  }

  if (isTfaEnabled) {
    return path === '/tfa' || path === '/login' ? NextResponse.next() : NextResponse.redirect(new URL('/tfa', req.url))
  }

  if (isInvite) {
    return NextResponse.next()
  }

  if (isPublicPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if (isOnboarding) {
    return path !== '/' ? NextResponse.next() : NextResponse.redirect(new URL('/onboarding', req.url))
  }

  return NextResponse.next()
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
     */

    '/((?!api|_next/static|_next/image|favicon.ico|backgrounds|backgrounds/|icons|icons/).*)',
  ],
}
