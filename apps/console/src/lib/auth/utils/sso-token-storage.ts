const SSO_TOKEN_STORAGE_KEY = 'api_token'

export type SsoTokenType = 'api' | 'personal'

const getStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export const setSsoTokenAuthorization = (tokenType: SsoTokenType) => {
  try {
    getStorage()?.setItem(SSO_TOKEN_STORAGE_KEY, JSON.stringify({ tokenType }))
  } catch {
    return
  }
}

export const readSsoTokenAuthorization = (): SsoTokenType | null => {
  const raw = getStorage()?.getItem(SSO_TOKEN_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed: { tokenType?: SsoTokenType } = JSON.parse(raw)
    return parsed.tokenType === 'api' || parsed.tokenType === 'personal' ? parsed.tokenType : null
  } catch {
    return null
  }
}

export const clearSsoTokenAuthorization = () => {
  getStorage()?.removeItem(SSO_TOKEN_STORAGE_KEY)
}
