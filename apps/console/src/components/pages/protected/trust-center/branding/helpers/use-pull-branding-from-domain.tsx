'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ScanScanStatus, ScanScanType } from '@repo/codegen/src/schema'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { useCreateScan, useScanStatus } from '@/lib/graphql-hooks/scan'
import { TRUST_CENTER_QUERY_KEY } from '@/lib/graphql-hooks/trust-center'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { getScanBranding, OPENLANE_DOMAIN_SCAN_PERFORMER, parseScanMetadata } from '@/components/pages/protected/scans/detail/openlane-domain-scan/scan-metadata'

const POLL_TIMEOUT_MS = 3 * 60 * 1000

const BRANDING_THEME_HREF = '/trust-center/branding#theme'

type RunningPull = { scanId: string; domain: string }

export const usePullBrandingFromDomain = (onPulled: () => void) => {
  const { queryClient } = useGraphQLClient()
  const { successNotification, warningNotification, errorNotification } = useNotification()
  const { mutateAsync: createScan, isPending: isStarting } = useCreateScan()

  const [runningPull, setRunningPull] = useState<RunningPull | null>(null)

  const { data: scanStatus, error: scanStatusError } = useScanStatus(runningPull?.scanId)
  const scan = runningPull && scanStatus?.scan?.id === runningPull.scanId ? scanStatus.scan : undefined

  useEffect(() => {
    if (!runningPull) return

    const timeoutId = setTimeout(() => {
      setRunningPull(null)
      warningNotification({
        title: 'Still pulling branding',
        description: `${runningPull.domain} is taking longer than expected. The scan keeps running — reload this page in a few minutes to see the result.`,
      })
    }, POLL_TIMEOUT_MS)

    return () => clearTimeout(timeoutId)
  }, [runningPull, warningNotification])

  useEffect(() => {
    if (!runningPull || !scanStatusError) return

    setRunningPull(null)
    errorNotification({ title: 'Branding pull failed', description: parseErrorMessage(scanStatusError) })
  }, [runningPull, scanStatusError, errorNotification])

  useEffect(() => {
    if (!runningPull || !scan) return
    if (scan.status !== ScanScanStatus.COMPLETED && scan.status !== ScanScanStatus.FAILED) return

    setRunningPull(null)

    if (scan.status === ScanScanStatus.FAILED) {
      errorNotification({ title: 'Branding pull failed', description: `We could not read the branding of ${runningPull.domain}. Please try again.` })
      return
    }

    const branding = getScanBranding(parseScanMetadata(scan.metadata))

    if (!branding || branding.error) {
      warningNotification({
        title: 'No branding found',
        description: branding?.error ? `${runningPull.domain} could not be read: ${branding.error}` : `We could not find any branding on ${runningPull.domain}.`,
      })
      return
    }

    queryClient.invalidateQueries({ queryKey: TRUST_CENTER_QUERY_KEY, exact: true }).then(onPulled)
    successNotification({
      title: 'Branding pulled',
      description: (
        <span>
          {`We finished reading ${runningPull.domain}. `}
          <Link href={BRANDING_THEME_HREF} className="text-brand font-medium underline">
            Review your preview settings
          </Link>
          {', then publish when you are happy with them.'}
        </span>
      ),
    })
  }, [runningPull, scan, queryClient, onPulled, successNotification, warningNotification, errorNotification])

  const pullBrandingFromDomain = useCallback(
    async (domain: string) => {
      try {
        const response = await createScan({
          input: {
            target: domain,
            scanType: ScanScanType.DOMAIN,
            status: ScanScanStatus.PENDING,
            performedBy: OPENLANE_DOMAIN_SCAN_PERFORMER,
            metadata: {
              brandDesignOnly: true,
              applyBrandDesignToPreview: true,
              applyBrandDesignToLive: false,
            },
          },
        })

        setRunningPull({ scanId: response.createScan.scan.id, domain })
        return true
      } catch (error) {
        errorNotification({ title: 'Could not start branding pull', description: parseErrorMessage(error) })
        return false
      }
    },
    [createScan, errorNotification],
  )

  return {
    isPulling: isStarting || !!runningPull,
    pullBrandingFromDomain,
  }
}
