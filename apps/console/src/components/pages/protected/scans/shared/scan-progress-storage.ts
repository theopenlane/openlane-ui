import { safeGetItem, safeRemoveItem, safeSetItem } from '@/lib/storage/safe-local-storage'

export const loadScanProgress = <T>(storageKey: string): T | undefined => {
  const raw = safeGetItem(storageKey)
  if (!raw) return undefined
  try {
    return JSON.parse(raw) as T
  } catch {
    return undefined
  }
}

export const saveScanProgress = <T>(storageKey: string, progress: T) => safeSetItem(storageKey, JSON.stringify(progress))

export const clearScanProgress = (storageKey: string) => safeRemoveItem(storageKey)
