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

export const getTokenFromOpenlaneAPI = async (reqBody: OAuthUserRequest): Promise<{ success: true; data: any } | { success: false; message: string; status?: number; error_code?: string }> => {
  try {
    const payload = {
      externalUserId: reqBody.externalUserID?.toString(),
      email: reqBody.email,
      name: reqBody.name,
      image: reqBody.image,
      authProvider: reqBody.authProvider,
      clientToken: reqBody.accessToken,
    }

    const response = await secureFetch(`${openlaneAPIUrl}/oauth/register`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    // ✅ parse JSON once
    const json = await response.json()

    if (!response.ok) {
      return {
        success: false,
        message: json?.message || json?.error || `Openlane API failed: ${response.status}`,
        error_code: json?.error_code,
        status: response.status,
      }
    }

    if (json && !json.success) {
      return {
        success: false,
        message: json?.error || 'Unknown error',
        error_code: json?.error_code,
      }
    }

    return { success: true, data: json }
  } catch (error) {
    console.error('❌ Error in getTokenFromOpenlaneAPI:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error contacting Openlane',
    }
  }
}
