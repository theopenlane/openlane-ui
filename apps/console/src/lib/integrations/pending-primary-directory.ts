const STORAGE_KEY = 'pendingPrimaryDirectoryPrompt'
const TTL_MS = 10 * 60 * 1000

export type PendingPrimaryDirectoryPrompt = {
  providerId: string
  integrationId?: string
  baselineCount?: number
  startedAt: number
  expiresAt: number
}

type WritePendingPrimaryDirectoryPromptOptions = {
  integrationId?: string
  baselineCount?: number
}

const isBrowser = (): boolean => typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'

export const writePendingPrimaryDirectoryPrompt = (providerId: string, options?: WritePendingPrimaryDirectoryPromptOptions): void => {
  if (!isBrowser()) return
  const now = Date.now()
  const payload: PendingPrimaryDirectoryPrompt = {
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

export const readPendingPrimaryDirectoryPrompt = (): PendingPrimaryDirectoryPrompt | null => {
  if (!isBrowser()) return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PendingPrimaryDirectoryPrompt>
    if (typeof parsed.providerId !== 'string' || typeof parsed.expiresAt !== 'number' || typeof parsed.startedAt !== 'number') {
      return null
    }
    if (Date.now() > parsed.expiresAt) {
      window.sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed as PendingPrimaryDirectoryPrompt
  } catch {
    return null
  }
}

export const clearPendingPrimaryDirectoryPrompt = (): void => {
  if (!isBrowser()) return
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // no-op
  }
}
