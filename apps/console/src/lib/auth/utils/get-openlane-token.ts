import { openlaneAPIUrl } from '@repo/dally/auth'
import { secureFetch } from './secure-fetch'

export interface OAuthUserRequest {
  externalUserID: string | number
  email: string
  name: string
  image: string
  authProvider: string
  accessToken: string
}

export interface WebfingerConfig {
  success: boolean
  enforced: boolean
  provider: string
  organization_id: string
}

export const checkWebfinger = async (email: string): Promise<WebfingerConfig | null> => {
  try {
    const webfingerResponse = await secureFetch(`${openlaneAPIUrl}/.well-known/webfinger?resource=acct:${email}`)
    const ssoConfig = await webfingerResponse.json()

    if (ssoConfig.success && ssoConfig.enforced && ssoConfig.provider !== 'NONE' && ssoConfig.organization_id) {
      return ssoConfig as WebfingerConfig
    }
  } catch (error) {
    console.error('failed to check webfinger:', error)
  }

  return null
}

export const getSSORedirect = async (organizationId: string): Promise<{ redirect_uri: string; organization_id: string } | null> => {
  try {
    const ssoResponse = await secureFetch(`/api/auth/sso`, {
      method: 'POST',
      body: JSON.stringify({
        organization_id: organizationId,
      }),
    })

    const ssoData = await ssoResponse.json()

    if (ssoResponse.ok && ssoData.success && ssoData.redirect_uri) {
      return {
        redirect_uri: ssoData.redirect_uri,
        organization_id: organizationId,
      }
    }
  } catch (ssoError) {
    console.error('failed to get SSO redirect:', ssoError)
  }

  return null
}

export const checkSSOEnforcement = async (email: string): Promise<{ redirect_uri: string; organization_id: string } | null> => {
  const webfingerConfig = await checkWebfinger(email)

  if (webfingerConfig) {
    return await getSSORedirect(webfingerConfig.organization_id)
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
