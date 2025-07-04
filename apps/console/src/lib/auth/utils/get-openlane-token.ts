import { openlaneAPIUrl } from '@repo/dally/auth'
import { secureFetch } from './secure-fetch'

// getTokenFromOpenlaneAPI is a function that takes an oauth user and registers them
// with the openlane API to get an access token and refresh token
export interface OAuthUserRequest {
  externalUserID: string | number
  email: string
  name: string
  image: string
  authProvider: string
  accessToken: string
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
  }
}
