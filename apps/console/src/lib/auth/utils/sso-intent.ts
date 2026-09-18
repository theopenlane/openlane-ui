import { safeGetItem, safeRemoveItem, safeSetItem } from '@/lib/storage/safe-local-storage'

const SSO_INTENT_STORAGE_KEY = 'sso_intent'
const SSO_INTENT_TTL_MS = 10 * 60 * 1000

export type SsoTokenType = 'api' | 'personal'
export type SsoIntent = 'test' | SsoTokenType

const isSsoIntent = (value?: string): value is SsoIntent => value === 'test' || value === 'api' || value === 'personal'

export const readSsoIntent = (): SsoIntent | null => {
  const [intent, startedAt] = (safeGetItem(SSO_INTENT_STORAGE_KEY) ?? '').split(':')

  if (!isSsoIntent(intent)) return null

  const startedAtMs = Number(startedAt)

  return Number.isFinite(startedAtMs) && Date.now() - startedAtMs <= SSO_INTENT_TTL_MS ? intent : null
}

export const clearSsoIntent = () => {
  safeRemoveItem(SSO_INTENT_STORAGE_KEY)
}

export const startSsoRedirect = (redirectUri: string, intent?: SsoIntent): boolean => {
  if (intent && !safeSetItem(SSO_INTENT_STORAGE_KEY, `${intent}:${Date.now()}`)) {
    return false
  }

  if (!intent) {
    clearSsoIntent()
  }

  window.location.assign(redirectUri)

  return true
}
