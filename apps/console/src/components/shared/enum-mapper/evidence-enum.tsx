import React from 'react'
import { ArchiveX, FileArchive, FileSearch, FileText, Inbox, RefreshCw, Stamp } from 'lucide-react'
import { EvidenceEvidenceStatus } from '@repo/codegen/src/schema.ts'
import { Badge } from '@repo/ui/badge'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

export const EvidenceIconMapper: Record<EvidenceEvidenceStatus, React.ReactNode> = {
  [EvidenceEvidenceStatus.AUDITOR_APPROVED]: <Stamp height={16} width={16} className="text-approved" />,
  [EvidenceEvidenceStatus.REJECTED]: <ArchiveX height={16} width={16} className="text-rejected" />,
  [EvidenceEvidenceStatus.NEEDS_RENEWAL]: <RefreshCw height={16} width={16} className="text-needs-renewal" />,
  [EvidenceEvidenceStatus.READY_FOR_AUDITOR]: <FileArchive height={16} width={16} className="text-ready" />,
  [EvidenceEvidenceStatus.MISSING_ARTIFACT]: <FileSearch height={16} width={16} className="text-missing-artifact" />,
  [EvidenceEvidenceStatus.SUBMITTED]: <FileSearch height={16} width={16} className="text-approved" />,
  [EvidenceEvidenceStatus.IN_REVIEW]: <FileSearch height={16} width={16} className="text-missing-artifact" />,
  [EvidenceEvidenceStatus.DRAFT]: <FileText height={16} width={16} className="text-muted-foreground" />,
  [EvidenceEvidenceStatus.REQUESTED]: <Inbox height={16} width={16} className="text-requested" />,
}

export const EvidenceStatusColors: Record<EvidenceEvidenceStatus, string> = {
  [EvidenceEvidenceStatus.AUDITOR_APPROVED]: '#15803D',
  [EvidenceEvidenceStatus.REJECTED]: '#B91C1C',
  [EvidenceEvidenceStatus.NEEDS_RENEWAL]: '#CA8A04',
  [EvidenceEvidenceStatus.READY_FOR_AUDITOR]: '#16A34A',
  [EvidenceEvidenceStatus.MISSING_ARTIFACT]: '#EF4444',
  [EvidenceEvidenceStatus.SUBMITTED]: '#2563EB',
  [EvidenceEvidenceStatus.IN_REVIEW]: '#D97706',
  [EvidenceEvidenceStatus.DRAFT]: '#6B7280',
  [EvidenceEvidenceStatus.REQUESTED]: '#f97316',
}

const EVIDENCE_STATUS_SHORT_LABELS: Partial<Record<EvidenceEvidenceStatus, string>> = {
  [EvidenceEvidenceStatus.AUDITOR_APPROVED]: 'Approved',
  [EvidenceEvidenceStatus.READY_FOR_AUDITOR]: 'Ready',
}

export const getEvidenceStatusLabel = (status: EvidenceEvidenceStatus) => EVIDENCE_STATUS_SHORT_LABELS[status] ?? getEnumLabel(status)

export const getEvidenceStatusStyle = (status: EvidenceEvidenceStatus) => ({
  bg: `color-mix(in srgb, ${EvidenceStatusColors[status]} 15%, transparent)`,
  color: EvidenceStatusColors[status],
})

export const EvidenceStatusBadge = React.memo(({ status }: { status: EvidenceEvidenceStatus }) => (
  <Badge style={{ backgroundColor: EvidenceStatusColors[status] }} className="text-white text-xs font-medium">
    {getEvidenceStatusLabel(status)}
  </Badge>
))
EvidenceStatusBadge.displayName = 'EvidenceStatusBadge'

export const EvidenceStatusOptions = Object.values(EvidenceEvidenceStatus).map((status) => ({
  label: getEnumLabel(status),
  value: status,
}))

export const EvidenceStatusFilterOptions = EvidenceStatusOptions
