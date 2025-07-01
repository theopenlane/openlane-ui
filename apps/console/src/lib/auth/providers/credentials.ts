import { openlaneAPIUrl } from '@repo/dally/auth'
import Credentials from 'next-auth/providers/credentials'
import { setSessionCookie } from '../utils/set-session-cookie'
import { getDashboardData } from '@/app/api/getDashboardData/route'

// Standard username and password credentials provider
export const credentialsProvider = Credentials({
  id: 'credentials',
  name: 'credentials',
  credentials: {},
  async authorize(credentials: any) {
    let accessToken = ''
    let refreshToken = ''
    let session = ''

    try {
      if (!credentials.accessToken) {
        /**
         * Here we would call out to the Openlane API
         * to validate our credentials
         *
         * This runs on the server so we can store the API
         * route in an env var that way we don't expose
         * your API login routes to our end users
         */
        const fData = await fetch(`${openlaneAPIUrl}/v1/login`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            username: credentials.username,
            password: credentials.password,
          }),
        })

        if (fData.status !== 200) {
          const errorText = await fData.text()
          return { error: errorText }
        }
        if (fData.ok) {
          const data = await fData.json()

          accessToken = data?.access_token
          refreshToken = data?.refresh_token
          session = data?.session
        }
      } else {
        accessToken = credentials.accessToken
        refreshToken = credentials.refreshToken
        session = credentials.session
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
      const isTfaEnabled = data.edges.setting.is_tfa_enabled || false
      setSessionCookie(session)

      return {
        isTfaEnabled,
        isOnboarding: dashboardData.organizations?.edges?.length === 1,
        accessToken,
        refreshToken,
        ...data,
      }
    } catch (error) {
      console.error('Authorization error:', error)
    }

    return null
  },
})
