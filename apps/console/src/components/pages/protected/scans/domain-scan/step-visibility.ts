import type { DomainScanReport } from './hooks/use-domain-scan-report'
import type { StepId } from './types'

type StepVisibilityInput = Pick<DomainScanReport, 'systemCandidates' | 'allDomains' | 'vendors' | 'findings'>

export const domainScanStepVisibility = ({ systemCandidates, allDomains, vendors, findings }: StepVisibilityInput): Record<StepId, boolean> => {
  const hasVendors = vendors.length > 0
  const hasAssets = allDomains.length > 0

  return {
    platform: true,
    systems: systemCandidates.length > 0,
    assets: hasAssets,
    vendors: hasVendors,
    link: hasVendors || hasAssets,
    findings: findings.length > 0,
    confirm: true,
  }
}
