import { getOrganizationStorageItem, removeOrganizationStorageItem, setOrganizationStorageItem } from '@/lib/storage/organization-storage'

const ONBOARDING_FRAMEWORKS_KEY = 'onboarding-frameworks'
const ONBOARDING_FRAMEWORKS_TTL_MS = 30 * 24 * 60 * 60 * 1000

type StoredOnboardingFrameworks = {
  frameworks: string[]
  savedAt: number
  /** whether the org said it already has controls in place */
  existingControls?: boolean
}

const toStringArray = (value: unknown): string[] => (Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [])

const isFrameworksRecord = (value: unknown): value is { frameworks?: unknown; savedAt?: unknown; existingControls?: unknown } => typeof value === 'object' && value !== null && 'frameworks' in value

const parseStored = (stored: string): StoredOnboardingFrameworks | null => {
  try {
    const parsed: unknown = JSON.parse(stored)

    if (Array.isArray(parsed)) {
      return { frameworks: toStringArray(parsed), savedAt: Date.now() }
    }

    if (isFrameworksRecord(parsed)) {
      return {
        frameworks: toStringArray(parsed.frameworks),
        savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : Date.now(),
        existingControls: typeof parsed.existingControls === 'boolean' ? parsed.existingControls : undefined,
      }
    }

    return null
  } catch {
    return null
  }
}

export const setOnboardingFrameworks = (frameworkShortNames: string[], organizationId?: string, existingControls?: boolean): void => {
  const payload: StoredOnboardingFrameworks = { frameworks: frameworkShortNames, savedAt: Date.now(), existingControls }
  setOrganizationStorageItem(ONBOARDING_FRAMEWORKS_KEY, JSON.stringify(payload), organizationId)
}

/**
 * True when onboarding said the org has no controls yet. Undefined when the
 * question wasn't answered
 */
export const getOnboardingNeedsControls = (organizationId?: string): boolean | undefined => {
  const existingControls = getOnboardingExistingControls(organizationId)
  return existingControls === undefined ? undefined : existingControls === false
}

/**
 * Whether onboarding said the org already has controls; undefined when the
 * question wasn't answered or the data has expired
 */
export const getOnboardingExistingControls = (organizationId?: string): boolean | undefined => {
  const stored = getOrganizationStorageItem(ONBOARDING_FRAMEWORKS_KEY, organizationId)
  if (!stored) return undefined

  const parsed = parseStored(stored)
  if (!parsed || Date.now() - parsed.savedAt > ONBOARDING_FRAMEWORKS_TTL_MS) return undefined

  return parsed.existingControls
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
