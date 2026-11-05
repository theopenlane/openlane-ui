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
})

const safeLocalStorage = createSafeStorage(() => localStorage)

export const safeSessionStorage = createSafeStorage(() => sessionStorage)

export const safeGetItem = safeLocalStorage.getItem

export const safeSetItem = safeLocalStorage.setItem

export const safeRemoveItem = safeLocalStorage.removeItem
