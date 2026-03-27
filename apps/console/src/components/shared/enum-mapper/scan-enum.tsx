import { CircleAlert, CircleCheck, CircleEllipsis, CircleX } from 'lucide-react'
import { ScanScanStatus } from '@repo/codegen/src/schema.ts'
import { Badge } from '@repo/ui/badge'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

export const ScanStatusIconMapper: Record<ScanScanStatus, React.ReactNode> = {
  [ScanScanStatus.PENDING]: <CircleAlert height={16} width={16} className="text-pending" />,
  [ScanScanStatus.PROCESSING]: <CircleEllipsis height={16} width={16} className="text-processing" />,
  [ScanScanStatus.COMPLETED]: <CircleCheck height={16} width={16} className="text-completed" />,
  [ScanScanStatus.FAILED]: <CircleX height={16} width={16} className="text-failed" />,
}

const ScanStatusColorMapper: Record<ScanScanStatus, string> = {
  [ScanScanStatus.PENDING]: 'text-scan-pending bg-scan-pending-muted border-scan-pending-border',
  [ScanScanStatus.PROCESSING]: 'text-scan-processing bg-scan-processing-muted border-scan-processing-border',
  [ScanScanStatus.COMPLETED]: 'text-scan-completed bg-scan-completed-muted border-scan-completed-border',
  [ScanScanStatus.FAILED]: 'text-scan-failed bg-scan-failed-muted border-scan-failed-border',
}

export function ScanStatusBadge({ status }: { status: ScanScanStatus }) {
  return (
    <Badge variant="outline" className={`flex w-fit items-center text-center gap-1.5 text-xs leading-none py-0.5 px-2 ${ScanStatusColorMapper[status]}`}>
      {getEnumLabel(status)}
    </Badge>
  )
}
