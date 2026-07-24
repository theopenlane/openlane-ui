'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
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
    <SheetHeader>
      <SheetTitle className="sr-only">{title}</SheetTitle>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-md border shrink-0">{data && ScanTypeIconMapper[data.scanType]}</div>
          <p className="text-lg font-medium leading-6">{title}</p>
        </div>
        <div className="flex items-center gap-3">
          {isCompletedDomainScan && data && (
            <Button variant="secondary" onClick={() => router.push(`/exposure/scans/domain-scan?scanId=${encodeURIComponent(data.id)}`)}>
              View Report
            </Button>
          )}
          <button type="button" aria-label="Close" onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        This scan provides recommendations based on publicly available data and automated analysis. Results are not guaranteed to be complete or accurate and should be reviewed before use.
      </p>
    </SheetHeader>
  )
}

export default ScanDetailHeader
