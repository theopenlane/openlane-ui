import { getOrganizationStorageItem, removeOrganizationStorageItem, setOrganizationStorageItem } from './organization-storage'

const CONTROLS_KEY = 'onboardingImportControls'
const POLICIES_KEY = 'onboardingImportPolicies'

export const setOnboardingImportFlags = (orgId: string, flags: { controls: boolean; policies: boolean }): void => {
  if (flags.controls) setOrganizationStorageItem(CONTROLS_KEY, 'true', orgId)
  if (flags.policies) setOrganizationStorageItem(POLICIES_KEY, 'true', orgId)
}

// reads then immediately clears, so the banner it drives only ever shows once
export const consumeOnboardingImportControlsFlag = (orgId?: string): boolean => {
  const has = getOrganizationStorageItem(CONTROLS_KEY, orgId) === 'true'
  if (has) removeOrganizationStorageItem(CONTROLS_KEY, orgId)
  return has
}

export const consumeOnboardingImportPoliciesFlag = (orgId?: string): boolean => {
  const has = getOrganizationStorageItem(POLICIES_KEY, orgId) === 'true'
  if (has) removeOrganizationStorageItem(POLICIES_KEY, orgId)
  return has
}

// non-destructive checks, for deciding whether to surface a link to the walkthrough before the user gets there
export const hasOnboardingImportControlsFlag = (orgId?: string): boolean => getOrganizationStorageItem(CONTROLS_KEY, orgId) === 'true'

export const hasOnboardingImportPoliciesFlag = (orgId?: string): boolean => getOrganizationStorageItem(POLICIES_KEY, orgId) === 'true'
