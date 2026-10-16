import { useEffect, useMemo, useRef } from 'react'
import { ScanScanStatus, ScanScanType } from '@repo/codegen/src/schema'
import { useRecentDomainScans } from '@/lib/graphql-hooks/scan'
import { getScanBranding, parseScanMetadata, type ScanBranding } from '@/components/pages/protected/scans/detail/openlane-domain-scan/scan-metadata'
import { toHostname } from '@/utils/normalizeUrl'
import { SCAN_PERFORMER } from '@/constants/scan-performers'

const COMPLETED_SCANS_TO_SEARCH = 25

export type TRecentBranding = { branding: ScanBranding; scannedAt: string }

type UseRecentDomainBrandingArgs = {
  domains: string[]
  enabled: boolean
  isScanRunning: boolean
}

export const useRecentDomainBranding = ({ domains, enabled, isScanRunning }: UseRecentDomainBrandingArgs) => {
  const isEnabled = enabled && domains.length > 0
  const { scans, isPending, refetch } = useRecentDomainScans({
    where: { scanType: ScanScanType.DOMAIN, performedBy: SCAN_PERFORMER.DOMAIN_SCAN, status: ScanScanStatus.COMPLETED, targetIn: domains },
    first: COMPLETED_SCANS_TO_SEARCH,
    enabled: isEnabled,
  })

  const wasScanRunningRef = useRef(isScanRunning)

  useEffect(() => {
    if (wasScanRunningRef.current && !isScanRunning && isEnabled) refetch()
    wasScanRunningRef.current = isScanRunning
  }, [isScanRunning, isEnabled, refetch])

  const recentBrandingByDomain = useMemo(() => {
    const byDomain = new Map<string, TRecentBranding>()
    scans.forEach((scan) => {
      const branding = getScanBranding(parseScanMetadata(scan.metadata))
      const domain = toHostname(scan.target)
      if (!branding || branding.error || !domain || byDomain.has(domain)) return
      byDomain.set(domain, { branding, scannedAt: scan.createdAt })
    })
    return byDomain
  }, [scans])

  return { recentBrandingByDomain, isLoadingRecentBranding: isEnabled && isPending }
}
