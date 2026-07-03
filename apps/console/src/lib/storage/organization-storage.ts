const ORGANIZATION_SCOPE_SEGMENT = 'organization'

export const getOrganizationStorageKey = (key: string, organizationId?: string): string => `${key}:${ORGANIZATION_SCOPE_SEGMENT}:${organizationId ?? 'unresolved'}`

// Storage used to be keyed without the organization segment. Reads fall back to that
// legacy key so users upgraded from the unscoped format keep their stored state. Reads
// never write (they run in render-phase initializers, and the legacy value must stay
// available to a user's other organizations); instead any write or remove retires the
// legacy key — otherwise a cleared value would resurrect from the fallback.
export const getOrganizationStorageItem = (key: string, organizationId?: string): string | null => {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(getOrganizationStorageKey(key, organizationId)) ?? localStorage.getItem(key)
  } catch {
    return null
  }
}

export const setOrganizationStorageItem = (key: string, value: string, organizationId?: string): void => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(getOrganizationStorageKey(key, organizationId), value)
    localStorage.removeItem(key)
  } catch {
    return
  }
}

export const removeOrganizationStorageItem = (key: string, organizationId?: string): void => {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(getOrganizationStorageKey(key, organizationId))
    localStorage.removeItem(key)
  } catch {
    return
  }
}
