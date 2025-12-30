import { TrustCenterDocWatermarkStatus } from '@repo/codegen/src/schema'

type DocumentsWatermarkStatusChipProps = {
  status?: TrustCenterDocWatermarkStatus
  className?: string
}

const statusBgClasses: Record<TrustCenterDocWatermarkStatus, string> = {
  DISABLED: 'bg-gray-200 text-gray-700',
  FAILED: 'bg-red-100 text-red-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-blue-100 text-blue-700',
  SUCCESS: 'bg-green-100 text-green-700',
}

const DocumentsWatermarkStatusChip = ({ status, className }: DocumentsWatermarkStatusChipProps) => {
  const displayStatus = (status ?? 'PENDING').toLowerCase()
  const bgClass = statusBgClasses[status ?? 'PENDING']

  return (
    <div className={`inline-flex items-center gap-1 rounded-sm border border-switch-bg-inactive py-1 px-2 font-normal text-xs leading-4 shrink-0 ${bgClass} ${className ?? ''}`}>{displayStatus}</div>
  )
}

export default DocumentsWatermarkStatusChip
