import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { StatusBgClasses } from '@/components/shared/enum-mapper/watermark-enum'
import { TrustCenterDocWatermarkStatus } from '@repo/codegen/src/schema'

type DocumentsWatermarkStatusChipProps = {
  status?: TrustCenterDocWatermarkStatus
  className?: string
}
const DocumentsWatermarkStatusChip = ({ status, className }: DocumentsWatermarkStatusChipProps) => {
  const bgClass = StatusBgClasses[status ?? 'PENDING']

  return (
    <div className={`inline-flex items-center gap-1 rounded-sm border border-switch-bg-inactive py-1 px-2 font-normal text-xs leading-4 shrink-0 ${bgClass} ${className ?? ''}`}>
      {getEnumLabel(status ?? 'PENDING')}
    </div>
  )
}

export default DocumentsWatermarkStatusChip
