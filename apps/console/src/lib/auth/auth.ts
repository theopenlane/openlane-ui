import type { NextAuthConfig } from 'next-auth'
import NextAuth from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import { isDevelopment } from '@repo/dally/auth'
import { jwtDecode } from 'jwt-decode'
import { JwtPayload } from 'jsonwebtoken'
import { credentialsProvider } from './providers/credentials'
import { getTokenFromOpenlaneAPI, OAuthUserRequest } from './utils/get-openlane-token'
import { setSessionCookie } from './utils/set-session-cookie'
import { cookies } from 'next/headers'
import { sessionCookieName, allowedLoginDomains } from '@repo/dally/auth'
import { getDashboardData } from '@/app/api/getDashboardData/route'
import { passKeyProvider } from './providers/passkey'
import { skipCSRFCheck } from '@auth/core'

import { CredentialsSignin } from 'next-auth'
import { PlanEnum } from '@/lib/subscription-plan/plan-enum.ts'
import { featureUtil } from '@/lib/subscription-plan/plans.ts'

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
    async signOut() {
      const cookieStore = await cookies()
      if (sessionCookieName && cookieStore.has(sessionCookieName)) {
        cookieStore.delete(sessionCookieName)
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

      // If OAuth authentication
      if (account?.type === 'oauth' || account?.type === 'oidc') {
        const oauthUser = {
          ...user,
          externalUserID: account.providerAccountId,
          authProvider: account.provider,
          accessToken: account.access_token,
        }

        try {
          const data = await getTokenFromOpenlaneAPI(oauthUser as OAuthUserRequest)
          const dashboardData = await getDashboardData(data.access_token, data.session)

          if (!data) throw new Error(' ❌ Failed to fetch Openlane token')
          Object.assign(user, {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            session: data.session,
            isTfaEnabled: data.tfa_enabled,
            isOnboarding: dashboardData?.organizations?.edges?.length == 1,
          })

          // Store session in a cookie
          setSessionCookie(data.session)
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
          const decoded = jwtDecode<JwtPayload>(user.accessToken)
          if (decoded.exp) {
            token.expiresAt = decoded.exp * 1000 // Save as ms timestamp
          }
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
          const decoded = jwtDecode<JwtPayload>(account.access_token)
          if (decoded.exp) {
            token.expiresAt = decoded.exp * 1000
          }
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
        return { ...token, ...session?.user }
      }

      return token
    },
    async session({ session, token }) {
      try {
        const decodedToken = typeof token.accessToken === 'string' ? jwtDecode<JwtPayload>(token.accessToken) : {}
        const features = (decodedToken.modules ?? []).flatMap((m: PlanEnum) => featureUtil.getPlanFeatures(m)).filter((f: string, i: number, arr: string[]) => arr.indexOf(f) === i)

        session.user = {
          ...session.user,
          accessToken: token.accessToken ?? null,
          refreshToken: token.refreshToken ?? null,
          activeOrganizationId: decodedToken?.org ?? null,
          userId: decodedToken?.user_id ?? null,
          isTfaEnabled: token.isTfaEnabled ?? false,
          isOnboarding: token.isOnboarding ?? false,
          modules: decodedToken?.modules ?? [],
          features,
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
