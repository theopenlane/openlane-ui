import { NextResponse } from 'next/server'
import { auth } from './lib/auth/auth'

export default auth(async (req) => {
  // Attach `next-url` header for client-side route metadata
  req.headers.append('next-url', req.nextUrl.toString())

  //IF YOU ADD PUBLIC PAGE, ITS REQUIRED TO CHANGE IT IN Providers.tsx
  const publicPages = ['/login', '/login/sso', '/tfa', '/invite', '/subscriber-verify', '/verify', '/resend-verify', '/waitlist', '/unsubscribe', '/forgot-password', '/password-reset', '/signup']

  const personalOrgPages = ['/onboarding', '/organization', '/user-settings/profile']

  const path = req.nextUrl.pathname
  const isPublicPage = publicPages.includes(path)
  const validForPersonalOrg = personalOrgPages.includes(path)
  const isInvite = path === '/invite'
  const isUnsubscribe = path === '/unsubscribe'
  const isWaitlist = path === '/waitlist'

  const session = await auth()

  const isLoggedIn = req.auth?.user
  const isTfaEnabled = session?.user?.isTfaEnabled
  const isOnboarding = session?.user?.isOnboarding

  if (!isLoggedIn) {
    return isPublicPage ? NextResponse.next() : NextResponse.redirect(new URL('/login', req.url))
  }

  if (isTfaEnabled) {
    return path === '/tfa' || path === '/login' ? NextResponse.next() : NextResponse.redirect(new URL('/tfa', req.url))
  }

  if (isInvite || isUnsubscribe || isWaitlist) {
    return NextResponse.next()
  }

  if (isPublicPage) {
    // allow /login/sso to proceed if the user is testing the SSO flow
    console.log(req.cookies.get('is_test'))
    if (path === '/login/sso' && req.cookies.get('is_test')) {
      return NextResponse.next()
    }

    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if (isOnboarding) {
    return path !== '/' && validForPersonalOrg ? NextResponse.next() : NextResponse.redirect(new URL('/onboarding', req.url))
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

    '/((?!api|_next/static|_next/image|favicon.ico|backgrounds|backgrounds/|icons|icons/|images|images/).*)',
  ],
}
