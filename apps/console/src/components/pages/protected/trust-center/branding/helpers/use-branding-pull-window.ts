'use client'

import { useEffect, useMemo, useState } from 'react'
import { formatDistance } from 'date-fns'
import { ScanScanStatus, ScanScanType } from '@repo/codegen/src/schema'
import { useRecentDomainScans } from '@/lib/graphql-hooks/scan'
import { isGroupedDomainScan, OPENLANE_DOMAIN_SCAN_PERFORMER, parseScanMetadata } from '@/components/pages/protected/scans/detail/openlane-domain-scan/scan-metadata'

export const PULL_WINDOW_MS = 60 * 60 * 1000

const RECENT_SCAN_LIMIT = 50
const COUNTDOWN_TICK_MS = 30 * 1000

export const useBrandingPullWindow = (enabled: boolean) => {
  const [windowStart, setWindowStart] = useState<string>()
  const [now, setNow] = useState(0)

  useEffect(() => {
    if (!enabled) {
      setWindowStart(undefined)
      return
    }

    setWindowStart(new Date(Date.now() - PULL_WINDOW_MS).toISOString())
    setNow(Date.now())

    const intervalId = setInterval(() => setNow(Date.now()), COUNTDOWN_TICK_MS)
    return () => clearInterval(intervalId)
  }, [enabled])

  const { scans, isLoading } = useRecentDomainScans({
    where: { scanType: ScanScanType.DOMAIN, performedBy: OPENLANE_DOMAIN_SCAN_PERFORMER, createdAtGT: windowStart },
    first: RECENT_SCAN_LIMIT,
    enabled: enabled && !!windowStart,
  })

  return useMemo(() => {
    const requested = scans
      .filter((scan) => !isGroupedDomainScan(parseScanMetadata(scan.metadata)))
      .map((scan) => ({ ...scan, startedAt: new Date(scan.createdAt).getTime() }))
      .filter((scan) => !Number.isNaN(scan.startedAt))
      .sort((a, b) => a.startedAt - b.startedAt)

    const running = requested.find((scan) => scan.status === ScanScanStatus.PROCESSING)
    const windowAnchor = requested.find((scan) => scan.status !== ScanScanStatus.PENDING)
    const availableAt = windowAnchor ? windowAnchor.startedAt + PULL_WINDOW_MS : null
    const queued = requested.find((scan) => scan.status === ScanScanStatus.PENDING)

    return {
      isCheckingWindow: enabled && (!windowStart || isLoading),
      runningScanTarget: running?.target ?? queued?.target ?? null,
      pullAvailableIn: availableAt !== null && availableAt > now ? formatDistance(availableAt, now) : null,
    }
  }, [scans, isLoading, now, enabled, windowStart])
}
