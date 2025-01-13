import { openlaneAPIUrl } from '@repo/dally/auth'

interface Tokens {
  accessToken: string
  refreshToken: string
}

export const fetchNewAccessToken = async (refreshToken: string): Promise<Tokens | null> => {
  try {
    // Determine API URL: Absolute URL on server, relative on client
    const apiUrl = `${openlaneAPIUrl}/v1/refresh`
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!response.ok) {
      console.error(`Failed to refresh access token. Status: ${response.status}`)
      return null
    }

    const data = await response.json()

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    }
  } catch (error) {
    console.error('Refresh token request failed:', error)
    return null
  }
}
