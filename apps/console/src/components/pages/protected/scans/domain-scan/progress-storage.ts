import type { LinkRecord } from '../shared/selection-utils'
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
