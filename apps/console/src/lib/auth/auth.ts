import type { NextAuthConfig } from 'next-auth'
import NextAuth from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import { restUrl } from '@repo/dally/auth'
import { jwtDecode } from 'jwt-decode'
import { JwtPayload } from 'jsonwebtoken'
import { credentialsProvider } from './providers/credentials'
import { passKeyProvider } from './providers/passkey'
import { getTokenFromOpenlaneAPI } from './utils/get-openlane-token'
import { setSessionCookie } from './utils/set-session-cookie'
import { cookies } from 'next/headers'
import { sessionCookieName } from '@repo/dally/auth'

const isDevelopment = process.env.NODE_ENV === 'development'

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
    passKeyProvider,
  ],
  events: {
    async signOut() {
      if (sessionCookieName) {
        cookies().delete(sessionCookieName)
      }
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      // register user that signed in via oauth provider
      if (account?.type === 'oauth' || account?.type === 'oidc') {
        const oauthUser = {
          externalUserID: account?.providerAccountId,
          name: user.name,
          email: user.email,
          image: user.image,
          authProvider: account?.provider,
          accessToken: account?.access_token,
        }

        const data = await getTokenFromOpenlaneAPI(oauthUser)

        // set access token to pull additional data from the API
        user.accessToken = data?.access_token
        user.refreshToken = data?.refresh_token
        user.session = data?.session
        // Get user data for sessions
        const uData = await fetch(`${restUrl}/oauth/userinfo`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${user.accessToken}` },
        })

        //Save session to cookie
        setSessionCookie(data?.session)

        if (uData.ok) {
          const userJson = await uData.json()

          user.email = userJson?.email
          user.name = `${userJson?.first_name as string} ${userJson?.last_name as string}`
          user.image = userJson?.avatar_remote_url
        }
      }

      return true
    },
    jwt({ token, user, account, profile, trigger, session }) {
      /* 
      set tokens on user
      */
      if (typeof user !== 'undefined') {
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
      } else if (account) {
        token.accessToken = account.accessToken
        token.refreshToken = account.refreshToken
      }

      if (typeof profile !== 'undefined') {
        token.name = profile.name ?? token.name
        token.email = profile.email
      }

      if (trigger === 'update') {
        return { ...token, ...session.user }
      }

      return token
    },
    session({ session, token }) {
      /**
       * Here we can persist data into the client-side
       * session object that is used to read data
       * from the `useSession` hook in our react client
       * components
       *
       * Note our server components will also see this data
       * but do not use a client side hook to access it
       * as that data is memoized in the Node process
       */
      if (session.user) {
        // parse jwt
        const decodedToken = jwtDecode(
          token.accessToken as string,
        ) as JwtPayload

        session.user.name = token.name
        session.user.email = token.email
        session.user.accessToken = token.accessToken
        session.user.refreshToken = token.refreshToken
        session.user.organization = decodedToken?.org
        session.user.userId = decodedToken?.user_id
      }

      return session
    },
    async redirect({ baseUrl }) {
      return baseUrl
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
