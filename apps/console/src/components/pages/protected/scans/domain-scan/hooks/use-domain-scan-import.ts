'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useImportDomainScanReview, useUpdateScan } from '@/lib/graphql-hooks/scan'
import { buildImportDomainScanReviewInput } from '../build-import-payload'
import { resolveScanIds } from '../notification-mappers'
import { clearDomainScanProgress } from '../progress-storage'
import type { DomainScanReport } from './use-domain-scan-report'
import type { DomainScanSelection } from './use-domain-scan-selection'

type UseDomainScanImportArgs = {
  report: DomainScanReport
  selection: DomainScanSelection
  storageKey?: string
}

export const useDomainScanImport = ({ report, selection, storageKey }: UseDomainScanImportArgs) => {
  const router = useRouter()
  const { data: session } = useSession()
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: importDomainScanReview, isPending: isImporting } = useImportDomainScanReview()
  const { mutateAsync: updateScan } = useUpdateScan()

  const scanIds = useMemo(() => resolveScanIds(report.notificationData), [report.notificationData])

  const namedPlatformTargets = selection.platformTargets.filter((target) => target.name.trim().length > 0)
  const namedSystemTargets = selection.resolvedSystemTargets.filter((system) => system.name.trim().length > 0)

  const hasImportableSelections =
    namedPlatformTargets.length > 0 ||
    namedSystemTargets.length > 0 ||
    selection.selectedVendorObjects.length > 0 ||
    selection.selectedDomainObjects.length > 0 ||
    selection.selectedFindingObjects.length > 0

  const canImport = scanIds.length > 0 && hasImportableSelections

  const handleImport = async () => {
    if (scanIds.length === 0) {
      errorNotification({
        title: 'Import failed',
        description: 'This report is not linked to a scan, so there is nothing to import into. Re-open it from the notification bell and try again.',
      })
      return
    }

    const scanUrlByDomain = new Map((report.notificationData?.scans || []).map((scan) => [scan.domain?.toLowerCase() ?? '', scan.url]))

    const input = buildImportDomainScanReviewInput({
      scanIds,
      scanUrlByDomain,
      platformMode: selection.platformMode,
      platformTargets: selection.platformTargets,
      singlePlatformRef: selection.resolvedSinglePlatformTarget.id,
      systemTargets: selection.resolvedSystemTargets,
      selectedVendors: selection.selectedVendorObjects,
      selectedAssets: selection.selectedDomainObjects,
      linkOnlyVendors: selection.linkOnlyVendors,
      linkOnlyAssets: selection.linkOnlyAssets,
      vendorOverrides: selection.vendorOverrides,
      assetOverrides: selection.domainOverrides,
      findingOverrides: selection.findingOverrides,
      selectedFindings: selection.selectedFindingObjects,
      platformVendorLinks: selection.platformVendorLinks,
      platformAssetLinks: selection.platformAssetLinks,
      systemVendorLinks: selection.systemVendorLinks,
      systemAssetLinks: selection.systemAssetLinks,
    })

    try {
      const result = await importDomainScanReview({ input })

      if (!result.importDomainScanReview.accepted) {
        errorNotification({
          title: 'Import not accepted',
          description: 'The import was rejected before it started. Review your selections and try again.',
        })
        return
      }
    } catch (error) {
      errorNotification({
        title: 'Import failed',
        description: parseErrorMessage(error),
      })
      return
    }

    const reviewedByUserID = session?.user?.id
    if (reviewedByUserID) {
      await Promise.allSettled(scanIds.map((scanId) => updateScan({ updateScanId: scanId, input: { reviewedByUserID } })))
    }

    successNotification({
      title: 'Import submitted',
      description: "We're creating everything you selected. You will get a notification once it's ready.",
    })

    if (storageKey) {
      clearDomainScanProgress(storageKey)
    }

    router.push('/notifications')
  }

  return { handleImport, isImporting, canImport }
}
