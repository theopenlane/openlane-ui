import type { NextAuthConfig } from 'next-auth'
import NextAuth from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import { csrfCookieName, isDevelopment, openlaneAPIUrl } from '@repo/dally/auth'
import { jwtDecode } from 'jwt-decode'
import { type JwtPayload } from 'jsonwebtoken'
import { credentialsProvider } from './providers/credentials'
import { checkWebfinger, getTokenFromOpenlaneAPI, type OAuthUserRequest } from './utils/get-openlane-token'
import { setSessionCookie } from './utils/set-session-cookie'
import { secureFetch } from './utils/secure-fetch'
import { applyTokenUpdate } from './utils/jwt-token-update'
import { cookies } from 'next/headers'
import { allowedLoginDomains } from '@repo/dally/auth'
import { getDashboardData } from '@/app/api/getDashboardData/route'
import { passKeyProvider } from './providers/passkey'
import { skipCSRFCheck } from '@auth/core'

import { CredentialsSignin } from 'next-auth'

export class InvalidLoginError extends CredentialsSignin {
  code = 'Invalid login'
  constructor(message: string) {
    super(message)
    this.code = message
  }
}

const maxAge = process.env.SESSION_NEXAUTH_MAX_AGE ? +process.env.SESSION_NEXAUTH_MAX_AGE : 2 * 60 * 60 // fallback to 2h if undefined

export const config = {
  pages: {
    signIn: '/login',
    newUser: '/signup',
    verifyRequest: '/verify',
  },
  session: {
    strategy: 'jwt',
    maxAge,
  },
  providers: [
    GithubProvider({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      checks: isDevelopment ? ['none'] : undefined,
    }),
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      checks: isDevelopment ? ['none'] : undefined,
    }),
    credentialsProvider,
    passKeyProvider,
  ],
  // we have our own CSRF protection on the server side that is used
  // instead of the default NextAuth CSRF protection
  skipCSRFCheck: skipCSRFCheck,
  events: {
    async signOut(message) {
      const cookieStore = await cookies()
      // revoke the tokens and session on the server so logout is enforced server-side rather
      // than only clearing client state. Without this the access and refresh tokens remain valid
      // until they expire even after the user signs out
      const token = 'token' in message ? message.token : null
      const accessToken = token?.accessToken
      const refreshToken = token?.refreshToken

      if (accessToken || refreshToken) {
        try {
          const csrfToken = cookieStore.get(csrfCookieName)?.value
          const cookieHeader = cookieStore.toString()

          const response = await secureFetch(
            `${openlaneAPIUrl}/v1/logout`,
            {
              method: 'POST',
              headers: {
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                ...(cookieHeader ? { cookie: cookieHeader } : {}),
              },
              body: JSON.stringify({ refresh_token: refreshToken ?? '' }),
            },
            { token: csrfToken },
          )

          if (!response.ok) {
            console.error('Failed to revoke tokens on logout:', response.status, await response.text())
          }
        } catch (error) {
          console.error('Failed to revoke tokens on logout:', error)
        }
      }
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if ('error' in user && typeof user.error === 'string') {
        throw new InvalidLoginError(user.error)
      }

      const email = profile?.email || user?.email || ''

      // Allow only specific domains if configured
      const allow = allowedLoginDomains.length === 0 || allowedLoginDomains.some((domain) => email.endsWith(domain))

      if (!allow) {
        return '/waitlist'
      }

      // if OAuth authentication or passkey
      // we cannot use account?.type === 'credentials' as we already handle sso login differently on the
      // UI by showing the user a button that takes them to the sso auth page
      // else we will get into a non ending loop

      const checkSSO = await checkWebfinger(email)

      if (account?.provider === 'passkey' && checkSSO?.enforced) {
        return `/login/sso/enforce?email=${email}&organization_id=${checkSSO.organization_id}`
      }

      if (account?.type === 'oauth' || account?.type === 'oidc') {
        // if the user clicked the oauth signin buttons or passkey button this will be set to true
        // and if true, we need to check for sso enforcement
        //
        // This is also needed to rightfully know when a user is coming in via the login page
        // else we will be stuck in an endless loop for all sso verifications/login
        const cookieStore = await cookies()
        const isDirectOAuth = cookieStore.has('direct_oauth')

        const oauthUser = {
          ...user,
          externalUserID: account.providerAccountId,
          authProvider: account.provider,
          accessToken: account.access_token,
        }

        try {
          if (isDirectOAuth && checkSSO?.enforced) {
            return `/login/sso/enforce?email=${email}&organization_id=${checkSSO.organization_id}`
          }

          const result = await getTokenFromOpenlaneAPI(oauthUser as OAuthUserRequest)

          if (!result.success) {
            console.error('login failed: ', result.message)

            // ensure we give proper feedback to the user
            if (result.message.includes('email address is not allowed')) {
              return `/login?error=${encodeURIComponent(result.message)}`
            }

            return `/login?error=${encodeURIComponent('login failed, please try again')}`
          }

          const apiData = result.data

          const dashboardData = await getDashboardData(apiData.access_token, apiData.session)

          if (!apiData) throw new Error(' ❌ Failed to fetch Openlane token')

          Object.assign(user, {
            accessToken: apiData.access_token,
            refreshToken: apiData.refresh_token,
            session: apiData.session,
            isTfaEnabled: apiData.tfa_enabled,
            isOnboarding: dashboardData?.organizations?.edges?.length === 1,
          })

          // Store session in a cookie
          setSessionCookie(apiData.session)
        } catch (error) {
          console.error('❌ OAuth sign-in error:', error)
          return false
        }
      }

      return true
    },
    async jwt({ token, user, account, profile, trigger, session }) {
      // Initial login: populate token from `user` or `account`
      if (user?.accessToken) {
        Object.assign(token, {
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          isTfaEnabled: user.isTfaEnabled,
          isOnboarding: user.isOnboarding,
        })

        try {
          jwtDecode<JwtPayload>(user.accessToken)
        } catch (err) {
          console.error('❌ Failed to decode access token on login:', err)
          return null
        }
      } else if (account?.access_token) {
        Object.assign(token, {
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
        })

        try {
          jwtDecode<JwtPayload>(account.access_token)
        } catch (err) {
          console.error('❌ Failed to decode access token from account:', err)
        }
      }

      if (profile) {
        token.name = profile.name ?? token.name
        token.email = profile.email ?? token.email
      }

      // Handle session update
      if (trigger === 'update') {
        return applyTokenUpdate(token, session)
      }

      return token
    },
    async session({ session, token }) {
      try {
        const decodedToken = typeof token.accessToken === 'string' ? jwtDecode<JwtPayload>(token.accessToken) : {}

        const impersonatorId = (decodedToken as { impersonator_id?: string })?.impersonator_id
        const tokenType = (decodedToken as { type?: string })?.type
        const impersonationSessionId = (decodedToken as { session_id?: string })?.session_id

        session.user = {
          ...session.user,
          accessToken: token.accessToken ?? null,
          refreshToken: token.refreshToken ?? null,
          activeOrganizationId: decodedToken?.org ?? null,
          userId: decodedToken?.user_id ?? null,
          isTfaEnabled: token.isTfaEnabled ?? false,
          isOnboarding: token.isOnboarding ?? false,
          modules: decodedToken?.modules ?? [],
          isImpersonation: tokenType === 'support' || !!impersonatorId,
          impersonator: impersonatorId ?? null,
          impersonationSessionId: impersonationSessionId ?? null,
        }
      } catch (error) {
        console.error('JWT decoding error in session callback:', error)
      }

      return session
    },
  },
} satisfies NextAuthConfig

/**
 * Export our route handlers and functions
 * so that we can reuse them within our app
 */
export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(config)
