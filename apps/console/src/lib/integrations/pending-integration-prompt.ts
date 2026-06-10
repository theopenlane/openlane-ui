const STORAGE_KEY = 'pendingIntegrationPostConnectPrompt'
const TTL_MS = 10 * 60 * 1000

export type PendingIntegrationPrompt = {
  providerId: string
  integrationId?: string
  baselineCount?: number
  startedAt: number
  expiresAt: number
}

type WritePendingIntegrationPromptOptions = {
  integrationId?: string
  baselineCount?: number
}

const isBrowser = (): boolean => typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'

export const writePendingIntegrationPrompt = (providerId: string, options?: WritePendingIntegrationPromptOptions): void => {
  if (!isBrowser()) return
  const now = Date.now()
  const payload: PendingIntegrationPrompt = {
    providerId,
    integrationId: options?.integrationId,
    baselineCount: options?.baselineCount,
    startedAt: now,
    expiresAt: now + TTL_MS,
  }
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // sessionStorage may be disabled
  }
}

export const readPendingIntegrationPrompt = (): PendingIntegrationPrompt | null => {
  if (!isBrowser()) return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PendingIntegrationPrompt>
    if (typeof parsed.providerId !== 'string' || typeof parsed.expiresAt !== 'number' || typeof parsed.startedAt !== 'number') {
      return null
    }
    if (Date.now() > parsed.expiresAt) {
      window.sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed as PendingIntegrationPrompt
  } catch {
    return null
  }
}

export const clearPendingIntegrationPrompt = (): void => {
  if (!isBrowser()) return
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // no-op
  }
}
