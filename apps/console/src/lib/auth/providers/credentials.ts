import { openlaneAPIUrl } from '@repo/dally/auth'
import Credentials from 'next-auth/providers/credentials'
import { setSessionCookie } from '../utils/set-session-cookie'
import { getDashboardData } from '@/app/api/getDashboardData/route'

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
    }

    let accessToken = ''
    let refreshToken = ''
    let session = ''

    try {
      //handle session login for users that are logged in for the second time after verification
      if (credentials.accessToken && credentials.refreshToken && credentials.session) {
        accessToken = credentials.accessToken
        refreshToken = credentials.refreshToken
        session = credentials.session
      } else {
        // handle login from login form
        const fData = await fetch(`${openlaneAPIUrl}/v1/login`, {
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
      }

      const uData = await fetch(`${openlaneAPIUrl}/oauth/userinfo`, {
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

      setSessionCookie(session)

      return {
        isTfaEnabled,
        isOnboarding: dashboardData.organizations?.edges?.length === 1,
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
