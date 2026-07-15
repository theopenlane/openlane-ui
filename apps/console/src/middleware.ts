import { NextResponse } from 'next/server'
import { auth } from './lib/auth/auth'
import { featureUtil } from '@/lib/subscription-plan/plans'
import { buildLoginRedirect } from '@/lib/auth/utils/redirect'
import { SUPPORT_BLOCKED_PAGES } from '@/constants/support'

export default auth(async (req) => {
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
  const isQuestionnaire = path === '/questionnaire' || path.startsWith('/questionnaire/')

  const session = req.auth

  const isLoggedIn = !!session?.user
  const isTfaEnabled = session?.user?.isTfaEnabled
  const isOnboarding = session?.user?.isOnboarding

  const noModules = featureUtil.hasNoModules(session)
  const noModulesAllowedPages = ['/organization', '/organization-settings/billing', '/organization-settings/general-settings', '/user-settings/profile']

  if (!isLoggedIn) {
    if (isPublicPage) {
      return NextResponse.next()
    }
    const loginRedirect = buildLoginRedirect(`${req.nextUrl.pathname}${req.nextUrl.search}`)
    return NextResponse.redirect(new URL(loginRedirect, req.url))
  }

  if (isTfaEnabled) {
    return path === '/tfa' || path === '/login' ? NextResponse.next() : NextResponse.redirect(new URL('/tfa', req.url))
  }

  if (isInvite) {
    return NextResponse.next()
  }

  if (session?.user?.isImpersonation && SUPPORT_BLOCKED_PAGES.some((page) => path === page || path.startsWith(`${page}/`))) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // needed for accepting invites to orgs
  if (path === '/login/sso/enforce') {
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
