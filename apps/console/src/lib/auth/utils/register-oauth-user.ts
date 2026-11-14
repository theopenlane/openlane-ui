import { openlaneAPIUrl } from '@repo/dally/auth'
import { serverSecureFetch } from '@/lib/server/core-fetch'

export interface OAuthUserRequest {
  externalUserID: string | number
  email: string
  name: string
  image: string
  authProvider: string
  accessToken: string
}

export type TOAuthRegisterReply = {
  success: boolean
  message?: string
  error?: string
  tfa_enabled?: boolean
  access_token?: string
  refresh_token?: string
  session?: string
}

export const registerOAuthUser = async (
  reqBody: OAuthUserRequest,
): Promise<{ success: true; data: TOAuthRegisterReply; response: Response } | { success: false; message: string; status?: number }> => {
  try {
    const payload = {
      externalUserId: reqBody.externalUserID?.toString(),
      email: reqBody.email,
      name: reqBody.name,
      image: reqBody.image,
      authProvider: reqBody.authProvider,
      clientToken: reqBody.accessToken,
    }

    const response = await serverSecureFetch(`${openlaneAPIUrl}/oauth/register`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    const json: TOAuthRegisterReply = await response.json()

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

    return { success: true, data: json, response }
  } catch (error) {
    console.error('❌ Error in registerOAuthUser:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error contacting Openlane',
    }
  }
}
