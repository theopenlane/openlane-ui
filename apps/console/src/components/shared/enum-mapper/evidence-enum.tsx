import { ArchiveX, FileArchive, FileSearch, FileText, Inbox, RefreshCw, Stamp } from 'lucide-react'
import { EvidenceEvidenceStatus } from '@repo/codegen/src/schema.ts'
import { Badge } from '@repo/ui/badge'

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

export const ChartColorsSequence = ['#f97316', '#2563EB', '#16A34A', '#15803D', '#CA8A04', '#EF4444', '#B91C1C', '#2563EB', '#D97706']

export const EvidenceBadgeMapper: Record<EvidenceEvidenceStatus, React.ReactNode> = {
  [EvidenceEvidenceStatus.AUDITOR_APPROVED]: (
    <Badge style={{ backgroundColor: '#15803D' }} className="text-white text-xs font-medium">
      Approved
    </Badge>
  ),
  [EvidenceEvidenceStatus.REJECTED]: (
    <Badge style={{ backgroundColor: '#B91C1C' }} className="text-white text-xs font-medium">
      Rejected
    </Badge>
  ),
  [EvidenceEvidenceStatus.NEEDS_RENEWAL]: (
    <Badge style={{ backgroundColor: '#CA8A04' }} className="text-white text-xs font-medium">
      Needs Renewal
    </Badge>
  ),
  [EvidenceEvidenceStatus.READY_FOR_AUDITOR]: (
    <Badge style={{ backgroundColor: '#16A34A' }} className="text-white text-xs font-medium">
      Ready
    </Badge>
  ),
  [EvidenceEvidenceStatus.MISSING_ARTIFACT]: (
    <Badge style={{ backgroundColor: '#EF4444' }} className="text-white text-xs font-medium">
      Missing Artifact
    </Badge>
  ),
  [EvidenceEvidenceStatus.SUBMITTED]: (
    <Badge style={{ backgroundColor: '#2563EB' }} className="text-white text-xs font-medium">
      Submitted
    </Badge>
  ),
  [EvidenceEvidenceStatus.IN_REVIEW]: (
    <Badge style={{ backgroundColor: '#D97706' }} className="text-white text-xs font-medium">
      In Review
    </Badge>
  ),
  [EvidenceEvidenceStatus.DRAFT]: (
    <Badge style={{ backgroundColor: '#6B7280' }} className="text-white text-xs font-medium">
      Draft
    </Badge>
  ),
  [EvidenceEvidenceStatus.REQUESTED]: (
    <Badge style={{ backgroundColor: '#f97316' }} className="text-white text-xs font-medium">
      Requested
    </Badge>
  ),
}

export const EVIDENCE_STATUS_STYLES: Partial<Record<EvidenceEvidenceStatus, { bg: string; color: string }>> = {
  [EvidenceEvidenceStatus.REJECTED]: { bg: 'color-mix(in srgb, var(--color-rejected) 15%, transparent)', color: 'var(--color-rejected)' },
  [EvidenceEvidenceStatus.MISSING_ARTIFACT]: { bg: 'color-mix(in srgb, var(--color-missing-artifact) 15%, transparent)', color: 'var(--color-missing-artifact)' },
  [EvidenceEvidenceStatus.NEEDS_RENEWAL]: { bg: 'color-mix(in srgb, var(--color-needs-renewal) 15%, transparent)', color: 'var(--color-needs-renewal)' },
  [EvidenceEvidenceStatus.REQUESTED]: { bg: 'color-mix(in srgb, var(--color-requested) 15%, transparent)', color: 'var(--color-requested)' },
  [EvidenceEvidenceStatus.DRAFT]: { bg: 'color-mix(in srgb, var(--color-draft) 15%, transparent)', color: 'var(--color-draft)' },
  [EvidenceEvidenceStatus.SUBMITTED]: { bg: 'color-mix(in srgb, var(--color-approved) 15%, transparent)', color: 'var(--color-approved)' },
  [EvidenceEvidenceStatus.IN_REVIEW]: { bg: 'color-mix(in srgb, var(--color-in-review) 15%, transparent)', color: 'var(--color-in-review)' },
  [EvidenceEvidenceStatus.READY_FOR_AUDITOR]: { bg: 'color-mix(in srgb, var(--color-ready) 15%, transparent)', color: 'var(--color-ready)' },
  [EvidenceEvidenceStatus.AUDITOR_APPROVED]: { bg: 'color-mix(in srgb, var(--color-approved) 15%, transparent)', color: 'var(--color-approved)' },
}

// Status options for select dropdowns
export const EvidenceStatusOptions = Object.values(EvidenceEvidenceStatus).map((status) => ({
  label: status
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' '),
  value: status,
}))

// Status options for table filters
export const EvidenceStatusFilterOptions = Object.entries(EvidenceEvidenceStatus).map(([key, value]) => ({
  label: key
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase()),
  value,
}))
