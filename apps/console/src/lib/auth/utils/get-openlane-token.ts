import { openlaneAPIUrl } from '@repo/dally/auth'
import { secureFetch } from './secure-fetch'
import { parseSSOCookies, type CookieStore } from './parse-response-cookies'

export interface OAuthUserRequest {
  externalUserID: string | number
  email: string
  name: string
  image: string
  authProvider: string
  accessToken: string
}

export const checkSSOEnforcement = async (email: string, cookieStore?: CookieStore): Promise<{ redirect_uri: string; organization_id: string } | null> => {
  try {
    const webfingerResponse = await secureFetch(`${openlaneAPIUrl}/.well-known/webfinger?resource=acct:${email}`)
    const ssoConfig = await webfingerResponse.json()

    if (ssoConfig.success && ssoConfig.enforced && ssoConfig.provider !== 'NONE' && ssoConfig.organization_id) {
      try {
        const ssoResponse = await secureFetch(`${openlaneAPIUrl}/v1/sso/login`, {
          method: 'POST',
          body: JSON.stringify({
            organization_id: ssoConfig.organization_id,
          }),
        })

        const ssoData = await ssoResponse.json()

        if (ssoResponse.ok && ssoData.success && ssoData.redirect_uri) {
          const responseCookies = ssoResponse.headers.get('set-cookie')
          if (responseCookies && cookieStore) {
            parseSSOCookies(responseCookies, cookieStore)

            cookieStore.set('sso_redirect_url', ssoData.redirect_uri, {
              maxAge: 120,
              path: '/',
            })
            cookieStore.set('sso_organization_id', ssoConfig.organization_id, {
              maxAge: 120,
              path: '/',
            })
          }

          return {
            redirect_uri: ssoData.redirect_uri,
            organization_id: ssoConfig.organization_id,
          }
        }
      } catch (ssoError) {
        console.error('failed to get SSO redirect:', ssoError)
      }
    }
  } catch (error) {
    console.error('failed to check SSO enforcements:', error)
  }

  return null
}

export const getTokenFromOpenlaneAPI = async (reqBody: OAuthUserRequest) => {
  try {
    const response = await secureFetch(`${openlaneAPIUrl}/oauth/register`, {
      method: 'POST',
      body: JSON.stringify({
        externalUserId: reqBody.externalUserID.toString() as string,
        email: reqBody.email as string,
        name: reqBody.name as string,
        image: reqBody.image as string,
        authProvider: reqBody.authProvider as string,
        clientToken: reqBody.accessToken as string,
      }),
    })

    if (!response.ok) {
      console.error('❌Error response from API', response)
      throw new Error(`Error response from API`)
    }

    return await response.json()
  } catch (error) {
    console.error('❌Error response from API:', error)
    throw error
  }
}
