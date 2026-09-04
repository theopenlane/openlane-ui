import React from 'react'
import { ArchiveX, FileArchive, FileSearch, FileText, Inbox, RefreshCw, Stamp, type LucideIcon } from 'lucide-react'
import { EvidenceEvidenceStatus } from '@repo/codegen/src/schema.ts'
import { Badge, type BadgeProps } from '@repo/ui/badge'
import { TruncatedCell } from '@repo/ui/data-table'
import { cn } from '@repo/ui/lib/utils'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

export const EvidenceStatusColors: Record<EvidenceEvidenceStatus, string> = {
  [EvidenceEvidenceStatus.AUDITOR_APPROVED]: 'var(--color-evidence-auditor-approved)',
  [EvidenceEvidenceStatus.REJECTED]: 'var(--color-evidence-rejected)',
  [EvidenceEvidenceStatus.NEEDS_RENEWAL]: 'var(--color-evidence-needs-renewal)',
  [EvidenceEvidenceStatus.READY_FOR_AUDITOR]: 'var(--color-evidence-ready-for-auditor)',
  [EvidenceEvidenceStatus.MISSING_ARTIFACT]: 'var(--color-evidence-missing-artifact)',
  [EvidenceEvidenceStatus.SUBMITTED]: 'var(--color-evidence-submitted)',
  [EvidenceEvidenceStatus.IN_REVIEW]: 'var(--color-evidence-in-review)',
  [EvidenceEvidenceStatus.DRAFT]: 'var(--color-evidence-draft)',
  [EvidenceEvidenceStatus.REQUESTED]: 'var(--color-evidence-requested)',
}

const statusIcon = (status: EvidenceEvidenceStatus, Icon: LucideIcon) => <Icon size={16} className="shrink-0" style={{ color: EvidenceStatusColors[status] }} />

export const EvidenceIconMapper: Record<EvidenceEvidenceStatus, React.ReactNode> = {
  [EvidenceEvidenceStatus.AUDITOR_APPROVED]: statusIcon(EvidenceEvidenceStatus.AUDITOR_APPROVED, Stamp),
  [EvidenceEvidenceStatus.REJECTED]: statusIcon(EvidenceEvidenceStatus.REJECTED, ArchiveX),
  [EvidenceEvidenceStatus.NEEDS_RENEWAL]: statusIcon(EvidenceEvidenceStatus.NEEDS_RENEWAL, RefreshCw),
  [EvidenceEvidenceStatus.READY_FOR_AUDITOR]: statusIcon(EvidenceEvidenceStatus.READY_FOR_AUDITOR, FileArchive),
  [EvidenceEvidenceStatus.MISSING_ARTIFACT]: statusIcon(EvidenceEvidenceStatus.MISSING_ARTIFACT, FileSearch),
  [EvidenceEvidenceStatus.SUBMITTED]: statusIcon(EvidenceEvidenceStatus.SUBMITTED, FileSearch),
  [EvidenceEvidenceStatus.IN_REVIEW]: statusIcon(EvidenceEvidenceStatus.IN_REVIEW, FileSearch),
  [EvidenceEvidenceStatus.DRAFT]: statusIcon(EvidenceEvidenceStatus.DRAFT, FileText),
  [EvidenceEvidenceStatus.REQUESTED]: statusIcon(EvidenceEvidenceStatus.REQUESTED, Inbox),
}

export const getEvidenceStatusStyle = (status: EvidenceEvidenceStatus) => ({
  backgroundColor: `color-mix(in srgb, ${EvidenceStatusColors[status]} 15%, transparent)`,
  color: EvidenceStatusColors[status],
})

type EvidenceStatusBadgeProps = Omit<BadgeProps, 'variant' | 'style'> & { status: EvidenceEvidenceStatus }

export const EvidenceStatusBadge = ({ status, className, children, ...props }: EvidenceStatusBadgeProps) => (
  <Badge variant="secondary" className={cn('font-medium', className)} style={getEvidenceStatusStyle(status)} {...props}>
    {children ?? getEnumLabel(status)}
  </Badge>
)

export const EvidenceStatusIconLabel = ({ status }: { status?: EvidenceEvidenceStatus | null }) =>
  status ? (
    <div className="flex items-center space-x-2">
      {EvidenceIconMapper[status]}
      <TruncatedCell>{getEnumLabel(status)}</TruncatedCell>
    </div>
  ) : (
    <span className="text-muted-foreground">-</span>
  )

export const EvidenceStatusOptions = Object.values(EvidenceEvidenceStatus).map((status) => ({
  label: getEnumLabel(status),
  value: status,
}))
