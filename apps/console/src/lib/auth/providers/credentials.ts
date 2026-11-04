import { getDashboardData } from '@/app/api/getDashboardData/route'
import { SUPPORT_EMAIL_ADDRESS } from '@/constants'
import { openlaneAPIUrl } from '@repo/dally/auth'
import Credentials from 'next-auth/providers/credentials'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { secureFetch } from '../utils/secure-fetch'
import { setSessionCookie } from '../utils/set-session-cookie'

export const credentialsProvider = Credentials({
  id: 'credentials',
  name: 'credentials',
  credentials: {},

  async authorize(rawCredentials) {
    const credentials = rawCredentials as {
      username?: string
      password?: string
      accessToken?: string
      refreshToken?: string
      session?: string
      type?: string
    }

    if (credentials.type === 'support' && credentials.accessToken) {
      return {
        id: 'openlane-support',
        name: 'Openlane Support',
        email: SUPPORT_EMAIL_ADDRESS,
        accessToken: credentials.accessToken,
        refreshToken: '',
        session: '',
        isTfaEnabled: false,
        isOnboarding: false,
      }
    }

    let accessToken: string
    let refreshToken: string
    let session: string

    try {
      //handle session login for users that are logging in for the second time after verification
      if (credentials.accessToken && credentials.refreshToken && credentials.session) {
        accessToken = credentials.accessToken
        refreshToken = credentials.refreshToken
        session = credentials.session
      } else {
        // handle login from login form
        const fData = await secureFetch(`${openlaneAPIUrl}/v1/login`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            username: credentials.username,
            password: credentials.password,
          }),
        })

        if (!fData.ok) {
          const errorText = await fData.text()
          return { error: errorText }
        }

        const data = await fData.json()
        accessToken = data?.access_token
        refreshToken = data?.refresh_token
        session = data?.session

        if (data.tfa_enabled && !data.access_token) {
          // pass all cookies back to the browser
          const cookieStore = await cookies()
          const response = new NextResponse(null, { headers: fData.headers })
          for (const cookie of response.cookies.getAll()) {
            cookieStore.set(cookie)
          }

          return {
            isTfaEnabled: true,
          }
        }
      }

      const uData = await secureFetch(`${openlaneAPIUrl}/oauth/userinfo`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!uData.ok) {
        console.error('Failed to fetch user info')
        return null
      }

      const data = await uData.json()
      const dashboardData = await getDashboardData(accessToken, session)
      const isTfaEnabled = data?.edges?.setting?.is_tfa_enabled ?? false

      await setSessionCookie(session)

      return {
        isTfaEnabled,
        isOnboarding: dashboardData?.organizations?.edges?.length === 1,
        accessToken,
        refreshToken,
        session,
        ...data,
      }
    } catch (error) {
      console.error('Authorization error:', error)
      return null
    }
  },
})
