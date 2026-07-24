import { getOrganizationStorageItem, removeOrganizationStorageItem, setOrganizationStorageItem } from '@/lib/storage/organization-storage'

const ONBOARDING_TASKS_PENDING_KEY = 'onboarding-tasks-pending'
const ONBOARDING_TASKS_PENDING_TTL_MS = 5 * 60 * 1000

export const setOnboardingTasksPending = (organizationId?: string): void => {
  setOrganizationStorageItem(ONBOARDING_TASKS_PENDING_KEY, String(Date.now()), organizationId)
}

export const clearOnboardingTasksPending = (organizationId?: string): void => {
  removeOrganizationStorageItem(ONBOARDING_TASKS_PENDING_KEY, organizationId)
}

export const getOnboardingTasksPending = (organizationId?: string): boolean => {
  const stored = getOrganizationStorageItem(ONBOARDING_TASKS_PENDING_KEY, organizationId)
  if (!stored) return false

  const savedAt = Number(stored)
  if (!Number.isFinite(savedAt) || Date.now() - savedAt > ONBOARDING_TASKS_PENDING_TTL_MS) {
    clearOnboardingTasksPending(organizationId)
    return false
  }

  return true
}
