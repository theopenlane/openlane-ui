import type { NextAuthConfig } from 'next-auth'
import NextAuth from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import { isDevelopment, openlaneAPIUrl } from '@repo/dally/auth'
import { jwtDecode } from 'jwt-decode'
import { JwtPayload } from 'jsonwebtoken'
import { credentialsProvider } from './providers/credentials'
import { getTokenFromOpenlaneAPI } from './utils/get-openlane-token'
import { setSessionCookie } from './utils/set-session-cookie'
import { cookies, type UnsafeUnwrappedCookies } from 'next/headers'
import { sessionCookieName, allowedLoginDomains } from '@repo/dally/auth'
import { fetchNewAccessToken } from './utils/refresh-token'
import { getDashboardData } from '@/app/api/getDashboardData/route'

export const config = {
  pages: {
    signIn: '/login',
    newUser: '/signup',
    verifyRequest: '/verify',
  },
  session: {
    strategy: 'jwt',
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
    // passKeyProvider,
  ],
  events: {
    async signOut() {
      if (sessionCookieName && (cookies() as unknown as UnsafeUnwrappedCookies).has(sessionCookieName)) {
        ;(cookies() as unknown as UnsafeUnwrappedCookies).delete(sessionCookieName)
      }
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      let email = profile?.email || user?.email || ''

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
          const data = await getTokenFromOpenlaneAPI(oauthUser)
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
      // Store user tokens on initial login
      if (user) {
        Object.assign(token, {
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          expiresAt: Date.now() + 1000 * 60 * 15,
          isTfaEnabled: user.isTfaEnabled,
          isOnboarding: user.isOnboarding,
        })
      } else if (account) {
        Object.assign(token, {
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: Date.now() + 1000 * 60 * 15,
        })
      }

      if (typeof token.accessToken === 'string') {
        try {
          const decoded = jwtDecode<JwtPayload>(token.accessToken)
          if (decoded.exp) {
            const expirationTime = decoded.exp * 1000 // Convert exp to milliseconds
            const refreshTime = expirationTime - 15 * 60 * 1000 // Refresh 45 minutes before expiration
            if (Date.now() >= refreshTime) {
              const newToken = await fetchNewAccessToken(token.refreshToken as string)

              if (!newToken) {
                console.error('❌ Refresh token expired or invalid, logging out user')
                return null
              }

              Object.assign(token, {
                accessToken: newToken.accessToken,
                refreshToken: newToken.refreshToken ?? token.refreshToken,
                expiresAt: Date.now() + 60 * 60 * 1000, // Set new expiration for 1 hour
              })
            }
          }
        } catch (error) {
          console.error('❌ Error decoding JWT:', error)
          return null
        }
      }

      // Store profile data
      if (profile) {
        Object.assign(token, {
          name: profile.name ?? token.name,
          email: profile.email ?? token.email,
        })
      }

      // Handle session updates
      if (trigger === 'update') {
        return { ...token, ...session.user }
      }

      return token
    },
    async session({ session, token }) {
      try {
        if (session.user && typeof token.accessToken === 'string' && token.accessToken.trim() !== '') {
          const decodedToken = jwtDecode<JwtPayload>(token.accessToken)

          Object.assign(session.user, {
            accessToken: token.accessToken,
            refreshToken: token.refreshToken,
            activeOrganizationId: decodedToken?.org,
            userId: decodedToken?.user_id,
            isTfaEnabled: token.isTfaEnabled,
            isOnboarding: token.isOnboarding,
          })
        }
      } catch (error) {
        console.error('JWT decoding error:', error)
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
