'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { FileText } from 'lucide-react'
import { SlideoutHeader } from '@/components/shared/crud-base/slideout-header'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { ScanTypeIconMapper } from '@/components/shared/enum-mapper/scan-enum'
import { ScanScanType, ScanScanStatus } from '@repo/codegen/src/schema'
import type { ScanDetailNode } from '@/lib/graphql-hooks/scan'

type Props = {
  data?: ScanDetailNode
  onClose: () => void
}

const ScanDetailHeader: React.FC<Props> = ({ data, onClose }) => {
  const router = useRouter()
  const title = data ? `${getEnumLabel(data.scanType)} Scan` : 'Scan'
  const isCompletedDomainScan = data?.scanType === ScanScanType.DOMAIN && data?.status === ScanScanStatus.COMPLETED

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
          isCompletedDomainScan && data
            ? {
                label: 'View report',
                variant: 'secondary',
                icon: <FileText size={16} />,
                onClick: () => router.push(`/exposure/scans/domain-scan?scanId=${encodeURIComponent(data.id)}`),
              }
            : undefined
        }
      />
      <p className="text-xs text-muted-foreground mt-2">
        This scan provides recommendations based on publicly available data and automated analysis. Results are not guaranteed to be complete or accurate and should be reviewed before use.
      </p>
    </>
  )
}

export default ScanDetailHeader
