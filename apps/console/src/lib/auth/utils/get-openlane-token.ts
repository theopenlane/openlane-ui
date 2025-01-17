import { openlaneAPIUrl } from '@repo/dally/auth'

// getTokenFromOpenlaneAPI is a function that takes an oauth user and registers them
// with the openlane API to get an access token and refresh token
export const getTokenFromOpenlaneAPI = async (reqBody: any) => {
  try {
    const response = await fetch(`${openlaneAPIUrl}/oauth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
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
