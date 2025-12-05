import { ArchiveX, Bot, CircleDot, FileArchive, FileSearch, FileText, FolderPen, RefreshCw, Stamp, type LucideIcon } from 'lucide-react'
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
}

export const EvidenceStatusMapper: Record<EvidenceEvidenceStatus, string> = {
  [EvidenceEvidenceStatus.AUDITOR_APPROVED]: 'Approved by Auditor',
  [EvidenceEvidenceStatus.REJECTED]: 'Rejected',
  [EvidenceEvidenceStatus.NEEDS_RENEWAL]: 'Needs renewal',
  [EvidenceEvidenceStatus.READY_FOR_AUDITOR]: 'Ready for auditor',
  [EvidenceEvidenceStatus.MISSING_ARTIFACT]: 'Missing artifact',
  [EvidenceEvidenceStatus.SUBMITTED]: 'Submitted',
  [EvidenceEvidenceStatus.IN_REVIEW]: 'In review',
}

export enum EvidenceFilterIconName {
  Name = 'Name',
  Description = 'Description',
  IsAutomated = 'IsAutomated',
  Status = 'Status',
}

export const FilterIcons: Record<EvidenceFilterIconName, LucideIcon> = {
  [EvidenceFilterIconName.Name]: FolderPen,
  [EvidenceFilterIconName.Description]: FileText,
  [EvidenceFilterIconName.IsAutomated]: Bot,
  [EvidenceFilterIconName.Status]: CircleDot,
}

export const ChartColorsSequence = ['#16A34A', '#15803D', '#CA8A04', '#EF4444', '#B91C1C', '#2563EB', '#D97706']

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
