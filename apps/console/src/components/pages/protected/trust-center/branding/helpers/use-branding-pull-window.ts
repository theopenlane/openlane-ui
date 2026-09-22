'use client'

import { useEffect, useMemo, useState } from 'react'
import { ScanScanStatus, ScanScanType } from '@repo/codegen/src/schema'
import { isActiveScanStatus, isStaleActiveScan, useRecentDomainScans } from '@/lib/graphql-hooks/scan'
import { isGroupedDomainScan, OPENLANE_DOMAIN_SCAN_PERFORMER, parseScanMetadata } from '@/components/pages/protected/scans/detail/openlane-domain-scan/scan-metadata'
import { formatDistanceUntil } from '@/utils/date'

const PULL_WINDOW_MS = 60 * 60 * 1000 // 1hr

const GROUPED_SCAN_FANOUT_HEADROOM = 50
const COUNTDOWN_TICK_MS = 30 * 1000 // 30s

export const useBrandingPullWindow = (enabled: boolean) => {
  const [windowStart, setWindowStart] = useState<string>()
  const [now, setNow] = useState(() => Date.now())

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

  const { scans, isLoading, isError } = useRecentDomainScans({
    where: { scanType: ScanScanType.DOMAIN, performedBy: OPENLANE_DOMAIN_SCAN_PERFORMER, createdAtGT: windowStart },
    first: GROUPED_SCAN_FANOUT_HEADROOM,
    enabled: enabled && !!windowStart,
  })

  return useMemo(() => {
    const requested = scans
      .filter((scan) => !isGroupedDomainScan(parseScanMetadata(scan.metadata)))
      .map((scan) => ({ ...scan, startedAt: new Date(scan.createdAt).getTime() }))
      .filter((scan) => !Number.isNaN(scan.startedAt))
      .sort((a, b) => a.startedAt - b.startedAt)

    const stillRunning = requested.filter((scan) => isActiveScanStatus(scan.status) && !isStaleActiveScan(scan.createdAt, now))
    const running = stillRunning.find((scan) => scan.status === ScanScanStatus.PROCESSING) ?? stillRunning.find((scan) => scan.status === ScanScanStatus.PENDING)
    const windowAnchor = requested.findLast((scan) => scan.status !== ScanScanStatus.PENDING)
    const availableAt = windowAnchor ? windowAnchor.startedAt + PULL_WINDOW_MS : null

    return {
      isCheckingWindow: enabled && !isError && (!windowStart || isLoading),
      scanHistoryUnavailable: isError,
      runningScanTarget: running?.target ?? null,
      pullAvailableIn: availableAt !== null && availableAt > now ? formatDistanceUntil(availableAt, now) : null,
    }
  }, [scans, isLoading, isError, now, enabled, windowStart])
}
