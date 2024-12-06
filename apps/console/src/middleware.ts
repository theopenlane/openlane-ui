/**
 * check into why this default export isn't working
 * export { auth as default } from './lib/auth'
 */

import { NextResponse } from 'next/server'
import { auth } from './lib/auth/auth'
import { cookies } from 'next/headers'
import { sessionCookieName } from '@repo/dally/auth'

export default auth((req) => {
  /**
   * Set this header so we can read it and set the current route
   * and metadata on the client side without invoking the
   * navigation hooks in React
   */
  req.headers.append('next-url', req.nextUrl.toString())

  /**
   * Here we are running middleware on each matched route
   * in the config below.
   *
   * For this example we are just checking that the request
   * has a valid user attached and session cookie and if so let the user
   * continue on, otherwise redirect them to the login page
   */

  let hasSessionCookie = true

  if (sessionCookieName) {
    const sessionData = cookies().get(sessionCookieName)

    // if the session cookie is not present, redirect to sign in
    if (sessionData == null || sessionData.value == "") {
      hasSessionCookie = false
    }
  }

  if (req.auth?.user && hasSessionCookie) return NextResponse.next()

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
    '\/((?!api|[_next\/static]|[_next\/image]|favicon.ico|backgrounds|backgrounds\/|icons|icons\/|login|verify|resend-verify|waitlist|invite).*)',
  ],
}