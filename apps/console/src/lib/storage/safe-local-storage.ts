const createSafeStorage = (getStorage: () => Storage) => ({
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null
    try {
      return getStorage().getItem(key)
    } catch {
      return null
    }
  },
  setItem: (key: string, value: string): boolean => {
    if (typeof window === 'undefined') return false
    try {
      getStorage().setItem(key, value)
      return true
    } catch {
      return false
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return
    try {
      getStorage().removeItem(key)
    } catch {
      return
    }
  },
  removeItemsWithPrefix: (prefix: string): void => {
    if (typeof window === 'undefined') return
    try {
      const storage = getStorage()
      const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter((key): key is string => !!key?.startsWith(prefix))
      keys.forEach((key) => storage.removeItem(key))
    } catch {
      return
    }
  },
})

const safeLocalStorage = createSafeStorage(() => localStorage)

export const safeSessionStorage = createSafeStorage(() => sessionStorage)

export const safeGetItem = safeLocalStorage.getItem

export const safeSetItem = safeLocalStorage.setItem

export const safeRemoveItem = safeLocalStorage.removeItem

export const safeRemoveItemsWithPrefix = safeLocalStorage.removeItemsWithPrefix
