export const safeGetItem = (key: string): string | null => {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export const safeSetItem = (key: string, value: string): boolean => {
  if (typeof window === 'undefined') return false
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export const safeRemoveItem = (key: string): void => {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(key)
  } catch {
    return
  }
}

export const safeRemoveItemsWithPrefix = (prefix: string): void => {
  if (typeof window === 'undefined') return
  try {
    const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)).filter((key): key is string => !!key?.startsWith(prefix))
    keys.forEach((key) => localStorage.removeItem(key))
  } catch {
    return
  }
}
