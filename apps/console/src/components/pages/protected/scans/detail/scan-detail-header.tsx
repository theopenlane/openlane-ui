'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { FileText } from 'lucide-react'
import { SlideoutHeader } from '@/components/shared/crud-base/slideout-header'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { ScanTypeIconMapper } from '@/components/shared/enum-mapper/scan-enum'
import { ScanScanType, ScanScanStatus } from '@repo/codegen/src/schema'
import type { ScanDetailNode } from '@/lib/graphql-hooks/scan'
import { isReviewableScanType, scanReviewHref } from '@/constants/scan-routes'

type Props = {
  data?: ScanDetailNode
  onClose: () => void
}

const ScanDetailHeader: React.FC<Props> = ({ data, onClose }) => {
  const router = useRouter()
  const title = data ? `${getEnumLabel(data.scanType)} Scan` : 'Scan'
  const reviewHref = data?.status === ScanScanStatus.COMPLETED && isReviewableScanType(data.scanType) ? scanReviewHref(data.scanType, data.id) : undefined

  return (
    <>
      <SlideoutHeader
        title={
          <span className="flex items-center gap-3">
            <span className="flex items-center justify-center w-9 h-9 rounded-md border shrink-0">{data && ScanTypeIconMapper[data.scanType]}</span>
            <span className="text-lg font-medium leading-6">{title}</span>
          </span>
        }
        onClose={onClose}
        primaryAction={
          reviewHref
            ? {
                label: 'View report',
                variant: 'secondary',
                icon: <FileText size={16} />,
                onClick: () => router.push(reviewHref),
              }
            : undefined
        }
      />
      <p className="text-xs text-muted-foreground mt-2">
        {data?.scanType === ScanScanType.REPORT
          ? 'This scan reads the report you uploaded with automated analysis.'
          : 'This scan provides recommendations based on publicly available data and automated analysis.'}{' '}
        Results are not guaranteed to be complete or accurate and should be reviewed before use.
      </p>
    </>
  )
}

export default ScanDetailHeader
