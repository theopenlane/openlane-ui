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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getTokenFromOpenlaneAPI = async (reqBody: OAuthUserRequest): Promise<{ success: true; data: any } | { success: false; message: string; status?: number }> => {
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

    const json = await response.json()

    if (!response.ok) {
      return {
        success: false,
        message: json?.message || json?.error || `Openlane API failed: ${response.status}`,
        status: response.status,
      }
    }

    if (json && !json.success) {
      return {
        success: false,
        message: json?.error || 'Unknown error',
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
