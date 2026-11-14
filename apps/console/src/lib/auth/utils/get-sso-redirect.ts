import { secureFetch } from './secure-fetch'

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
