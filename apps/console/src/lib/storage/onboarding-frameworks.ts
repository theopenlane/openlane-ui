import { getOrganizationStorageItem, removeOrganizationStorageItem, setOrganizationStorageItem } from '@/lib/storage/organization-storage'

const ONBOARDING_FRAMEWORKS_KEY = 'onboarding-frameworks'
const ONBOARDING_FRAMEWORKS_TTL_MS = 30 * 24 * 60 * 60 * 1000

type StoredOnboardingFrameworks = {
  frameworks: string[]
  savedAt: number
}

const toStringArray = (value: unknown): string[] => (Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [])

const isFrameworksRecord = (value: unknown): value is { frameworks?: unknown; savedAt?: unknown } => typeof value === 'object' && value !== null && 'frameworks' in value

const parseStored = (stored: string): StoredOnboardingFrameworks | null => {
  try {
    const parsed: unknown = JSON.parse(stored)

    if (Array.isArray(parsed)) {
      return { frameworks: toStringArray(parsed), savedAt: Date.now() }
    }

    if (isFrameworksRecord(parsed)) {
      return { frameworks: toStringArray(parsed.frameworks), savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : Date.now() }
    }

    return null
  } catch {
    return null
  }
}

export const setOnboardingFrameworks = (frameworkShortNames: string[], organizationId?: string): void => {
  const payload: StoredOnboardingFrameworks = { frameworks: frameworkShortNames, savedAt: Date.now() }
  setOrganizationStorageItem(ONBOARDING_FRAMEWORKS_KEY, JSON.stringify(payload), organizationId)
}

export const clearOnboardingFrameworks = (organizationId?: string): void => {
  removeOrganizationStorageItem(ONBOARDING_FRAMEWORKS_KEY, organizationId)
}

export const getOnboardingFrameworks = (organizationId?: string): string[] => {
  const stored = getOrganizationStorageItem(ONBOARDING_FRAMEWORKS_KEY, organizationId)
  if (!stored) return []

  const parsed = parseStored(stored)
  if (!parsed) return []

  if (Date.now() - parsed.savedAt > ONBOARDING_FRAMEWORKS_TTL_MS) {
    clearOnboardingFrameworks(organizationId)
    return []
  }

  return parsed.frameworks
}
