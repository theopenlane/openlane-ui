import { CircleAlert, CircleCheck, CircleEllipsis, CircleX, FileText, Globe, Info, Server, Building2, ShieldAlert, type LucideIcon } from 'lucide-react'
import { ScanScanStatus, ScanScanType } from '@repo/codegen/src/schema.ts'
import { Badge } from '@repo/ui/badge'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { toHumanLabel } from '@/utils/strings'
import { cn } from '@repo/ui/lib/utils'
export const ScanTypeIconMapper: Record<ScanScanType, React.ReactNode> = {
  [ScanScanType.DOMAIN]: <Globe height={16} width={16} />,
  [ScanScanType.PROVIDER]: <Server height={16} width={16} />,
  [ScanScanType.VENDOR]: <Building2 height={16} width={16} />,
  [ScanScanType.VULNERABILITY]: <ShieldAlert height={16} width={16} />,
  [ScanScanType.REPORT]: <FileText height={16} width={16} />,
}

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

export const PostureStatus = {
  Good: 'good',
  Warn: 'warn',
  Bad: 'bad',
  Info: 'info',
} as const

export type PostureStatus = (typeof PostureStatus)[keyof typeof PostureStatus]

export const isPostureIssue = (status: PostureStatus): boolean => status === PostureStatus.Warn || status === PostureStatus.Bad

export const PostureStatusIconMapper: Record<PostureStatus, { Icon: LucideIcon; className: string }> = {
  [PostureStatus.Good]: { Icon: CircleCheck, className: 'text-success' },
  [PostureStatus.Warn]: { Icon: CircleAlert, className: 'text-warning' },
  [PostureStatus.Bad]: { Icon: CircleX, className: 'text-destructive' },
  [PostureStatus.Info]: { Icon: Info, className: 'text-muted-foreground' },
}

export function PostureStatusIcon({ status, size = 14, className = '' }: { status: PostureStatus; size?: number; className?: string }) {
  const { Icon, className: color } = PostureStatusIconMapper[status]
  return <Icon size={size} className={cn(color, className)} />
}

// document types whose label is an expansion toHumanLabel cannot derive
const ComplianceDocumentTypeOverrides: Record<string, string> = {
  dpa: 'Data Privacy Agreement',
}

export const getComplianceDocumentLabel = (type: string): string => ComplianceDocumentTypeOverrides[type] ?? toHumanLabel(type)
