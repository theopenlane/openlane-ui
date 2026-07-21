import { getOrganizationStorageItem, setOrganizationStorageItem } from '@/lib/storage/organization-storage'

const ONBOARDING_FRAMEWORKS_KEY = 'onboarding-frameworks'

export const setOnboardingFrameworks = (frameworkShortNames: string[], organizationId?: string): void => {
  setOrganizationStorageItem(ONBOARDING_FRAMEWORKS_KEY, JSON.stringify(frameworkShortNames), organizationId)
}

export const getOnboardingFrameworks = (organizationId?: string): string[] => {
  const stored = getOrganizationStorageItem(ONBOARDING_FRAMEWORKS_KEY, organizationId)
  if (!stored) return []

  try {
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : []
  } catch {
    return []
  }
}
