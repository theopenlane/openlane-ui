import { restUrl } from '@repo/dally/auth'
import Credentials from 'next-auth/providers/credentials'
import { setSessionCookie } from '../utils/set-session-cookie'

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
        const fData = await fetch(`${restUrl}/v1/login`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            username: credentials.username,
            password: credentials.password,
          }),
        })

        if (fData.status !== 200) {
          const errorText = await fData.text()
          throw new Error(errorText) //TODO: Sentry logging
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

      setSessionCookie(session)

      const uData = await fetch(`${restUrl}/oauth/userinfo`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (uData.ok) {
        const data = await uData.json()
        return {
          accessToken,
          refreshToken,
          email: data?.email,
          name: `${data?.first_name} ${data?.last_name}`,
          image: data?.avatar_remote_url,
          ...data,
        }
      } else {
        console.error('Failed to fetch user info')
      }
    } catch (error) {
      console.error('Authorization error:', error)
    }

    return null
  },
})
