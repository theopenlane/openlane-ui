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
  try {
    const raw = getStorage()?.getItem(SSO_TOKEN_STORAGE_KEY)
    if (!raw) return null
    const parsed: { tokenType?: SsoTokenType } = JSON.parse(raw)
    return parsed.tokenType === 'api' || parsed.tokenType === 'personal' ? parsed.tokenType : null
  } catch {
    return null
  }
}

export const clearSsoTokenAuthorization = () => {
  try {
    getStorage()?.removeItem(SSO_TOKEN_STORAGE_KEY)
  } catch {
    return
  }
}
