import {
  Archive,
  ArrowUpFromDot,
  BinocularsIcon,
  BookMarked,
  CaseSensitive,
  Circle,
  Clock,
  FileBadge2,
  FilePenLine,
  FolderIcon,
  FolderSymlink,
  FolderTree,
  IdCard,
  RefreshCw,
  RouteOff,
  ScanEye,
  Settings2,
  Shapes,
  Stamp,
  ThumbsUp,
  MapPin,
} from 'lucide-react'
import { type ControlControlSource, ControlControlStatus, ControlImplementationDocumentStatus } from '@repo/codegen/src/schema.ts'
import { getEnumLabel } from './common-enum'
import { tintedSurfaceStyle } from '@/utils/color-contrast'

export const ControlIconMapper16: Record<ControlControlStatus, React.ReactNode> = {
  [ControlControlStatus.DRAFT]: <FilePenLine height={16} width={16} className="text-draft" />,
  [ControlControlStatus.APPROVED]: <Stamp height={16} width={16} className="text-approved" />,
  [ControlControlStatus.NEEDS_APPROVAL]: <ScanEye height={16} width={16} className="text-needs-approval" />,
  [ControlControlStatus.CHANGES_REQUESTED]: <RefreshCw height={16} width={16} className="text-changes-requested" />,
  [ControlControlStatus.ARCHIVED]: <Archive height={16} width={16} className="text-archived" />,
  [ControlControlStatus.NOT_IMPLEMENTED]: <RouteOff height={16} width={16} className="text-not-implemented" />,
  [ControlControlStatus.PREPARING]: <Circle height={16} width={16} className="text-preparing" />,
  [ControlControlStatus.NOT_APPLICABLE]: <Circle height={16} width={16} className="text-preparing" />,
}

export const ControlImplementationIconMap: Record<ControlImplementationDocumentStatus, React.ReactNode> = {
  [ControlImplementationDocumentStatus.DRAFT]: <FilePenLine size={16} />,
  [ControlImplementationDocumentStatus.APPROVED]: <ThumbsUp size={16} />,
  [ControlImplementationDocumentStatus.ARCHIVED]: <Archive size={16} />,
  [ControlImplementationDocumentStatus.NEEDS_APPROVAL]: <ScanEye size={16} />,
  [ControlImplementationDocumentStatus.PENDING]: <Clock size={16} />,
  [ControlImplementationDocumentStatus.PUBLISHED]: <Archive size={16} />,
}

const UNKNOWN_ORG_COVERAGE_SEVERITY_RANK = 5

const ORG_COVERAGE_SEVERITY_RANK: Record<ControlControlStatus, number> = {
  [ControlControlStatus.CHANGES_REQUESTED]: 0,
  [ControlControlStatus.NEEDS_APPROVAL]: 1,
  [ControlControlStatus.PREPARING]: 2,
  [ControlControlStatus.NOT_IMPLEMENTED]: 3,
  [ControlControlStatus.DRAFT]: 4,
  [ControlControlStatus.APPROVED]: 6,
  [ControlControlStatus.ARCHIVED]: 7,
  [ControlControlStatus.NOT_APPLICABLE]: 7,
}

export const getOrgCoverageSeverityRank = (status: ControlControlStatus): number => ORG_COVERAGE_SEVERITY_RANK[status] ?? UNKNOWN_ORG_COVERAGE_SEVERITY_RANK

const CONTROL_STATUS_COLORS: Record<ControlControlStatus, string> = {
  [ControlControlStatus.DRAFT]: 'var(--color-draft)',
  [ControlControlStatus.CHANGES_REQUESTED]: 'var(--color-changes-requested)',
  [ControlControlStatus.NEEDS_APPROVAL]: 'var(--color-needs-approval)',
  [ControlControlStatus.PREPARING]: 'var(--color-preparing)',
  [ControlControlStatus.NOT_IMPLEMENTED]: 'var(--color-not-implemented)',
  [ControlControlStatus.APPROVED]: 'var(--color-approved)',
  [ControlControlStatus.ARCHIVED]: 'var(--color-archived)',
  [ControlControlStatus.NOT_APPLICABLE]: 'var(--color-preparing)',
}

export const getControlStatusStyle = (status: ControlControlStatus) => tintedSurfaceStyle(CONTROL_STATUS_COLORS[status] ?? 'var(--muted-foreground)')

// Tooltip explanations for control statuses
export const ControlStatusTooltips: Record<ControlControlStatus, string> = {
  [ControlControlStatus.DRAFT]: 'Control is a draft and should be updated before it is ready for implementation and review.',
  [ControlControlStatus.NOT_IMPLEMENTED]:
    'Control has not been implemented yet. This is the initial state for new controls, controls are not considered as part of an audit program until they are implemented.',
  [ControlControlStatus.PREPARING]: 'Control is being prepared and documented. Implementation details are being worked on to prepare for review and approval.',
  [ControlControlStatus.NEEDS_APPROVAL]: 'Control implementation is complete and ready for review and approval internally',
  [ControlControlStatus.CHANGES_REQUESTED]: 'Control was reviewed but changes were requested. Updates are needed before approval.',
  [ControlControlStatus.APPROVED]: 'Control has been reviewed and approved. Implementation meets requirements and is ready to be used in an audit program.',
  [ControlControlStatus.ARCHIVED]: 'Control is no longer active or relevant. Archived for historical reference.',
  [ControlControlStatus.NOT_APPLICABLE]: 'Not applicable',
}

export enum ControlsFilterIconName {
  RefCode = 'RefCode',
  Program = 'Program',
  Category = 'Category',
  Subcategory = 'Subcategory',
  Status = 'Status',
  Standard = 'Standard',
  Owners = 'Owners',
  ProgramName = 'ProgramName',
  Type = 'Type',
  LinkedPolicies = 'LinkedPolicies',
  Comments = 'Comments',
}

// Status options for select dropdowns
export const ControlStatusOptions = Object.values(ControlControlStatus).map((status) => ({
  label: getEnumLabel(status),
  value: status,
}))

export const ControlImplementationStatusOptions = Object.values(ControlImplementationDocumentStatus).map((status) => ({
  label: status
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' '),
  value: status,
}))

// Status options for table filters
export const ControlStatusFilterOptions = Object.entries(ControlControlStatus).map(([key, value]) => ({
  label: key
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase()),
  value,
}))

export const sourceLabels: Record<ControlControlSource, string> = {
  FRAMEWORK: 'Framework',
  IMPORTED: 'Imported',
  TEMPLATE: 'Template',
  USER_DEFINED: 'User defined',
}

export const controlIconsMap: Record<string, React.ReactNode> = {
  Framework: <FileBadge2 size={16} />,
  Control: <Settings2 size={16} />,
  Category: <FolderIcon size={16} />,
  Subcategory: <FolderTree size={16} />,
  Status: <BinocularsIcon size={16} />,
  'Mapped categories': <FolderSymlink size={16} />,
  Source: <ArrowUpFromDot size={16} />,
  Type: <Shapes size={16} />,
  ID: <IdCard size={16} />,
  Reference: <BookMarked size={16} />,
  Alias: <CaseSensitive size={16} />,
  Origin: <MapPin size={16} />,
}
