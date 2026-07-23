import type { LinkRecord } from './selection-utils'
import type { OverrideMap, PlatformMode, StepId, SystemCandidate, TextOverride } from './types'

export const DOMAIN_SCAN_PROGRESS_STORAGE_PREFIX = 'domain-discovery-import:v2:'

export type PersistedProgress = {
  hasStarted: boolean
  stepId: StepId
  selectedVendorIds: string[]
  selectedDomainIds: string[]
  selectedFindingIds: string[]
  platformMode: PlatformMode
  singlePlatformOverride: TextOverride
  selectedPerSystemPlatformIds: string[]
  perSystemPlatformOverrides: OverrideMap
  systemOverrides: OverrideMap
  manualSystems: SystemCandidate[]
  removedDetectedSystemIds: string[]
  vendorOverrides: OverrideMap
  domainOverrides: OverrideMap
  findingOverrides: OverrideMap
  platformVendorLinks: LinkRecord
  platformAssetLinks: LinkRecord
  systemVendorLinks: LinkRecord
  systemAssetLinks: LinkRecord
}

export const domainScanProgressStorageKey = (scanId: string) => `${DOMAIN_SCAN_PROGRESS_STORAGE_PREFIX}${scanId}`

export const loadDomainScanProgress = (storageKey: string): PersistedProgress | undefined => {
  try {
    const raw = window.localStorage.getItem(storageKey)
    return raw ? (JSON.parse(raw) as PersistedProgress) : undefined
  } catch {
    return undefined
  }
}

export const saveDomainScanProgress = (storageKey: string, progress: PersistedProgress) => {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(progress))
  } catch {
    return
  }
}

export const clearDomainScanProgress = (storageKey: string) => {
  try {
    window.localStorage.removeItem(storageKey)
  } catch {
    return
  }
}
