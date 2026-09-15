import { CircleAlert, CircleCheck, CircleEllipsis, CircleX, Globe, Info, Server, Building2, ShieldAlert, type LucideIcon } from 'lucide-react'
import { ScanScanStatus, ScanScanType } from '@repo/codegen/src/schema.ts'
import { Badge } from '@repo/ui/badge'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

export const ScanTypeIconMapper: Record<ScanScanType, React.ReactNode> = {
  [ScanScanType.DOMAIN]: <Globe height={16} width={16} />,
  [ScanScanType.PROVIDER]: <Server height={16} width={16} />,
  [ScanScanType.VENDOR]: <Building2 height={16} width={16} />,
  [ScanScanType.VULNERABILITY]: <ShieldAlert height={16} width={16} />,
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

// PostureStatus is the good/warn/bad/info verdict a domain scan derives for a posture row
export type PostureStatus = 'good' | 'warn' | 'bad' | 'info'

export const PostureStatusIconMapper: Record<PostureStatus, { Icon: LucideIcon; className: string }> = {
  good: { Icon: CircleCheck, className: 'text-success' },
  warn: { Icon: CircleAlert, className: 'text-warning' },
  bad: { Icon: CircleX, className: 'text-destructive' },
  info: { Icon: Info, className: 'text-muted-foreground' },
}

export function PostureStatusIcon({ status, size = 14, className = '' }: { status: PostureStatus; size?: number; className?: string }) {
  const { Icon, className: color } = PostureStatusIconMapper[status]
  return <Icon size={size} className={`${color} ${className}`.trim()} />
}

// ComplianceDocumentTypeLabel maps the domain scan's compliance document types to display names
export const ComplianceDocumentTypeLabel: Record<string, string> = {
  privacy_policy: 'Privacy Policy',
  terms_of_service: 'Terms of Service',
  trust_center: 'Trust Center',
  dpa: 'Data Privacy Agreement',
  soc2_report: 'SOC 2 Report',
  subprocessors: 'Subprocessors',
  gdpr: 'GDPR',
  cookie_policy: 'Cookie Policy',
}

export const getComplianceDocumentLabel = (type: string): string => ComplianceDocumentTypeLabel[type] ?? getEnumLabel(type)
