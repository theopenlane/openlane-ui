import { useCallback, useEffect, useRef, useState } from 'react'
import { ScanScanStatus, ScanScanType } from '@repo/codegen/src/schema'
import { useCreateScan, useScanStatus } from '@/lib/graphql-hooks/scan'
import { useNotification } from '@/hooks/useNotification'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { getScanBranding, parseScanMetadata, type ScanBranding } from '@/components/pages/protected/scans/detail/openlane-domain-scan/scan-metadata'
import { SCAN_PERFORMER } from '@/constants/scan-performers'

const POLL_TIMEOUT_MS = 3 * 60 * 1000 // 3min

type RunningScan = { scanId: string; domain: string }

export type TBrandDesignApplyTargets = Partial<Record<'applyBrandDesignToPreview' | 'applyBrandDesignToLive', true>>

type UseDomainBrandingScanArgs = {
  applyTo?: TBrandDesignApplyTargets
  onBrandingFound: (branding: ScanBranding, domain: string) => void
}

export const useDomainBrandingScan = ({ applyTo, onBrandingFound }: UseDomainBrandingScanArgs) => {
  const { queryClient } = useGraphQLClient()
  const { warningNotification, errorNotification } = useNotification()
  const { mutateAsync: createScan, isPending: isStarting } = useCreateScan()

  const [runningScan, setRunningScan] = useState<RunningScan | null>(null)
  const onBrandingFoundRef = useRef(onBrandingFound)

  useEffect(() => {
    onBrandingFoundRef.current = onBrandingFound
  }, [onBrandingFound])

  const { data: scanStatus, error: scanStatusError } = useScanStatus(runningScan?.scanId)
  const scan = runningScan && scanStatus?.scan?.id === runningScan.scanId ? scanStatus.scan : undefined

  useEffect(() => {
    if (!runningScan) return

    const timeoutId = setTimeout(() => {
      setRunningScan(null)
      warningNotification({
        title: 'Still detecting branding',
        description: `${runningScan.domain} is taking longer than expected. The scan will keep running, feel free to navigate away and you'll receive a notification when it's ready.`,
      })
    }, POLL_TIMEOUT_MS)

    return () => clearTimeout(timeoutId)
  }, [runningScan, warningNotification])

  useEffect(() => {
    if (!runningScan || !scanStatusError) return

    setRunningScan(null)
    errorNotification({ title: 'Branding detection failed', description: parseErrorMessage(scanStatusError) })
  }, [runningScan, scanStatusError, errorNotification])

  useEffect(() => {
    if (!runningScan || !scan) return
    if (scan.status !== ScanScanStatus.COMPLETED && scan.status !== ScanScanStatus.FAILED) return

    setRunningScan(null)
    queryClient.invalidateQueries({ queryKey: ['scans'] })

    if (scan.status === ScanScanStatus.FAILED) {
      errorNotification({ title: 'Branding detection failed', description: `We could not read the branding of ${runningScan.domain}. Please try again later.` })
      return
    }

    const branding = getScanBranding(parseScanMetadata(scan.metadata))

    if (!branding || branding.error) {
      warningNotification({
        title: 'No branding found',
        description: branding?.error ? `${runningScan.domain} could not be read: ${branding.error}` : `We could not find any branding on ${runningScan.domain}.`,
      })
      return
    }

    onBrandingFoundRef.current(branding, runningScan.domain)
  }, [runningScan, scan, queryClient, warningNotification, errorNotification])

  const detectBranding = useCallback(
    async (domain: string) => {
      try {
        const response = await createScan({
          input: {
            target: domain,
            scanType: ScanScanType.DOMAIN,
            status: ScanScanStatus.PENDING,
            performedBy: SCAN_PERFORMER.DOMAIN_SCAN,
            metadata: { brandDesignOnly: true, ...applyTo },
          },
        })

        setRunningScan({ scanId: response.createScan.scan.id, domain })
        return true
      } catch (error) {
        errorNotification({ title: 'Could not start branding detection. Please try again later.', description: parseErrorMessage(error) })
        return false
      }
    },
    [createScan, errorNotification, applyTo],
  )

  return {
    isDetecting: isStarting || !!runningScan,
    detectingDomain: runningScan?.domain ?? null,
    detectBranding,
  }
}
