const STORAGE_KEY = 'pendingVendorIntegrationLink'
const TTL_MS = 10 * 60 * 1000

export type PendingVendorIntegrationLink = {
  vendorId: string
  providerId: string
  startedAt: number
  expiresAt: number
}

const isBrowser = (): boolean => typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'

export const writePendingVendorIntegrationLink = (vendorId: string, providerId: string): void => {
  if (!isBrowser()) return
  const now = Date.now()
  const payload: PendingVendorIntegrationLink = {
    vendorId,
    providerId,
    startedAt: now,
    expiresAt: now + TTL_MS,
  }
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // sessionStorage may be disabled (private mode, quota); silently no-op.
  }
}

export const readPendingVendorIntegrationLink = (): PendingVendorIntegrationLink | null => {
  if (!isBrowser()) return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PendingVendorIntegrationLink>
    if (typeof parsed.vendorId !== 'string' || typeof parsed.providerId !== 'string' || typeof parsed.expiresAt !== 'number' || typeof parsed.startedAt !== 'number') {
      return null
    }
    if (Date.now() > parsed.expiresAt) {
      window.sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed as PendingVendorIntegrationLink
  } catch {
    return null
  }
}

export const clearPendingVendorIntegrationLink = (): void => {
  if (!isBrowser()) return
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // no-op
  }
}
