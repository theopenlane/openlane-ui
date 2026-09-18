import { safeGetItem, safeRemoveItem, safeSetItem } from '@/lib/storage/safe-local-storage'

const ONBOARDING_CREATED_ORGANIZATION_TTL_MS = 60 * 60 * 1000

const storageKey = (userId: string): string => `onboarding-created-organization:user:${userId}`

type StoredCreatedOrganization = {
  organizationId: string
  savedAt: number
}

const isStoredCreatedOrganization = (value: unknown): value is StoredCreatedOrganization =>
  typeof value === 'object' && value !== null && 'organizationId' in value && typeof value.organizationId === 'string' && 'savedAt' in value && typeof value.savedAt === 'number'

export const setOnboardingCreatedOrganization = (organizationId: string, userId: string): void => {
  const payload: StoredCreatedOrganization = { organizationId, savedAt: Date.now() }
  safeSetItem(storageKey(userId), JSON.stringify(payload))
}

export const clearOnboardingCreatedOrganization = (userId: string): void => {
  safeRemoveItem(storageKey(userId))
}

export const getOnboardingCreatedOrganization = (userId: string): string | undefined => {
  const stored = safeGetItem(storageKey(userId))
  if (!stored) return undefined

  let parsed: unknown
  try {
    parsed = JSON.parse(stored)
  } catch {
    clearOnboardingCreatedOrganization(userId)
    return undefined
  }

  if (!isStoredCreatedOrganization(parsed)) {
    clearOnboardingCreatedOrganization(userId)
    return undefined
  }

  if (Date.now() - parsed.savedAt > ONBOARDING_CREATED_ORGANIZATION_TTL_MS) {
    clearOnboardingCreatedOrganization(userId)
    return undefined
  }

  return parsed.organizationId
}
