import { SUPPORT_BLOCKED_PAGES } from '@/constants/support'
import { TFA_PENDING_COOKIE_NAME } from '@/lib/auth/utils/constants'
import { buildLoginRedirect, buildTfaRedirect } from '@/lib/auth/utils/redirect'
import { featureUtil } from '@/lib/subscription-plan/plans'
import { NextResponse } from 'next/server'
import { auth } from './lib/auth/auth'
import { clearTfaPendingCookie } from '@/lib/auth/utils/tfa-pending-cookie'
import { isTfaEnrollmentToken } from '@/lib/auth/utils/token-claims'
import type { NextAuthRequest } from 'next-auth'

export default auth(async (req) => {
  const response = await handleRequest(req)

  // a signed in user should never still have a pending tfa login, clear any leftover cookie
  // so it cannot send them back to /tfa once they log out
  if (req.auth?.user?.accessToken && req.cookies.get(TFA_PENDING_COOKIE_NAME)?.value) {
    clearTfaPendingCookie(response.cookies)
  }

  return response
})

const handleRequest = async (req: NextAuthRequest) => {
  // Attach `next-url` header for client-side route metadata
  req.headers.append('next-url', req.nextUrl.toString())

  //IF YOU ADD PUBLIC PAGE, ITS REQUIRED TO CHANGE IT IN Providers.tsx
  const publicPages = [
    '/login',
    '/login/sso',
    '/login/sso/enforce',
    '/login/support',
    '/login/support/callback',
    '/tfa',
    '/invite',
    '/verify',
    '/resend-verify',
    '/forgot-password',
    '/password-reset',
    '/signup',
    '/questionnaire',
  ]

  const personalOrgPages = ['/onboarding', '/organization', '/user-settings/profile']

  const path = req.nextUrl.pathname
  // the public, shareable per-org SSO initiation page, e.g. /orgs/<slug>/sso
  const isSSOInitiate = /^\/orgs\/[^/]+\/sso$/.test(path)
  const isPublicPage = publicPages.includes(path) || path.startsWith('/questionnaire/') || isSSOInitiate
  const validForPersonalOrg = personalOrgPages.includes(path)
  const isInvite = path === '/invite'
  const isSSOCallback = path === '/login/sso' || path === '/login/sso/enforce'
  const isQuestionnaire = path === '/questionnaire' || path.startsWith('/questionnaire/')

  const session = req.auth

  const isLoggedIn = !!session?.user?.accessToken
  const isOnboarding = session?.user?.isOnboarding
  const pendingTfa = req.cookies.get(TFA_PENDING_COOKIE_NAME)?.value
  const accessTokenCookie = req.cookies.get('access_token')?.value
  const pendingEnrollment = isTfaEnrollmentToken(accessTokenCookie)

  const noModules = featureUtil.hasNoModules(session)
  const noModulesAllowedPages = ['/organization', '/organization-settings/billing', '/organization-settings/general-settings', '/user-settings/profile']

  // http only cookie so could not be deleted from the client
  // but if the user is trying to leave the tfa screen, we need to clear this out
  if ((pendingTfa || accessTokenCookie) && path === '/login' && req.nextUrl.searchParams.get('cleartfa')) {
    const response = NextResponse.next()
    clearTfaPendingCookie(response.cookies, true)
    return response
  }

  // if the cookie is yet to expire, do not let the user land on login or other pages,
  // force them to always land here
  //
  // user should not be able to land on this page without the cookie, if they somehow get here,
  // move them back to the login page
  if (path === '/tfa') {
    if (pendingTfa || pendingEnrollment) {
      return NextResponse.next()
    }

    const login = new URL(buildLoginRedirect(req.nextUrl.searchParams.get('redirect')), req.url)
    login.searchParams.set('error', 'Your login attempt expired. Please sign in again.')
    return NextResponse.redirect(login)
  }

  // if not logged in and user tries to go to another page, force them back to /tfa and add the redirect
  if (pendingEnrollment || (!isLoggedIn && pendingTfa)) {
    return NextResponse.redirect(new URL(buildTfaRedirect(`${path}${req.nextUrl.search}`), req.url))
  }

  if (!isLoggedIn) {
    if (isPublicPage) {
      return NextResponse.next()
    }
    const loginRedirect = buildLoginRedirect(`${req.nextUrl.pathname}${req.nextUrl.search}`)
    return NextResponse.redirect(new URL(loginRedirect, req.url))
  }

  if (isInvite) {
    return NextResponse.next()
  }

  if (session?.user?.isImpersonation && SUPPORT_BLOCKED_PAGES.some((page) => path === page || path.startsWith(`${page}/`))) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // needed for accepting invites to orgs
  //
  // also this is needed when users are coming from a shareable org slug
  //
  // the reason why we have this sso/enforce check initially was because the user is authenticated already and we need
  // to enforce them to go through that page if requred.
  //
  // /login/sso page only worked for unauthenticated users prior to sso shareable urls. so we need to enforce it here too
  // if an already authenticated user is coming through
  //
  // Else after sso shareable url is used, the user will always fall through to the /dashboard page and we will
  // never be able to switch
  if (isSSOCallback) {
    return NextResponse.next()
  }

  // the shareable per-org SSO initiation page is reachable by anyone, including users already
  // signed in to a different organization who are joining a new one via the link
  if (isSSOInitiate) {
    return NextResponse.next()
  }

  if (isPublicPage) {
    if (req.cookies.get('user_sso')) {
      return NextResponse.next()
    }

    // authenticated users should be able to access this page
    // so they can submit the questionnaire too.
    if (isQuestionnaire) {
      return NextResponse.next()
    }

    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if (noModules && !isOnboarding) {
    //users with no modules who are not in onboarding are restricted to specific settings pages
    return noModulesAllowedPages.includes(path) ? NextResponse.next() : NextResponse.redirect(new URL('/organization-settings/billing', req.url))
  }

  if (isOnboarding) {
    return path !== '/' && validForPersonalOrg ? NextResponse.next() : NextResponse.redirect(new URL('/onboarding', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt (crawler rules)
     * - public/backgrounds (background images)
     * - public/icons (images)
     */

    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|backgrounds|backgrounds/|icons|icons/|images|images/).*)',
  ],
}
