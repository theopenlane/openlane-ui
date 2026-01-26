import {
  Archive,
  ArrowUpFromDot,
  BinocularsIcon,
  Circle,
  CircleDot,
  FileBadge2,
  FilePenLine,
  FileText,
  Folder,
  FolderIcon,
  FolderSymlink,
  FolderTree,
  Key,
  Link,
  MessageCircle,
  RefreshCw,
  RouteOff,
  ScanEye,
  Settings2,
  Shapes,
  ShieldCheck,
  Stamp,
  Tag,
  ThumbsUp,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { ControlControlSource, ControlControlStatus, ControlImplementationDocumentStatus } from '@repo/codegen/src/schema.ts'

export const ControlIconMapper16: Record<ControlControlStatus, React.ReactNode> = {
  [ControlControlStatus.APPROVED]: <Stamp height={16} width={16} className="text-approved" />,
  [ControlControlStatus.NEEDS_APPROVAL]: <ScanEye height={16} width={16} className="text-needs-approval" />,
  [ControlControlStatus.CHANGES_REQUESTED]: <RefreshCw height={16} width={16} className="text-changes-requested" />,
  [ControlControlStatus.ARCHIVED]: <Archive height={16} width={16} className="text-archived" />,
  [ControlControlStatus.NOT_IMPLEMENTED]: <RouteOff height={16} width={16} className="text-not-implemented" />,
  [ControlControlStatus.PREPARING]: <Circle height={16} width={16} className="text-preparing" />,
  [ControlControlStatus.NOT_APPLICABLE]: <Circle height={16} width={16} className="text-preparing" />,
}

export const ControlIconMapper: Record<ControlControlStatus, React.ElementType> = {
  [ControlControlStatus.NOT_IMPLEMENTED]: RouteOff,
  [ControlControlStatus.PREPARING]: Circle,
  [ControlControlStatus.NEEDS_APPROVAL]: ScanEye,
  [ControlControlStatus.CHANGES_REQUESTED]: RefreshCw,
  [ControlControlStatus.APPROVED]: Stamp,
  [ControlControlStatus.ARCHIVED]: Circle,
  [ControlControlStatus.NOT_APPLICABLE]: Circle,
}

export const ControlImplementationIconMap: Record<ControlImplementationDocumentStatus, React.ReactNode> = {
  [ControlImplementationDocumentStatus.DRAFT]: <FilePenLine size={16} />,
  [ControlImplementationDocumentStatus.APPROVED]: <ThumbsUp size={16} />,
  [ControlImplementationDocumentStatus.ARCHIVED]: <Archive size={16} />,
  [ControlImplementationDocumentStatus.NEEDS_APPROVAL]: <ScanEye size={16} />, // Use distinct icon
  [ControlImplementationDocumentStatus.PUBLISHED]: <Archive size={16} />,
}

export const ControlStatusOrder: ControlControlStatus[] = [
  ControlControlStatus.NOT_IMPLEMENTED,
  ControlControlStatus.PREPARING,
  ControlControlStatus.NEEDS_APPROVAL,
  ControlControlStatus.CHANGES_REQUESTED,
  ControlControlStatus.APPROVED,
  ControlControlStatus.ARCHIVED,
]

export const ControlStatusLabels: Record<ControlControlStatus, string> = {
  [ControlControlStatus.NOT_IMPLEMENTED]: 'Not Implemented',
  [ControlControlStatus.PREPARING]: 'Preparing',
  [ControlControlStatus.NEEDS_APPROVAL]: 'Needs Approval',
  [ControlControlStatus.CHANGES_REQUESTED]: 'Changes Requested',
  [ControlControlStatus.APPROVED]: 'Approved',
  [ControlControlStatus.ARCHIVED]: 'Archived',
  [ControlControlStatus.NOT_APPLICABLE]: 'Not applicable',
}

// Tooltip explanations for control statuses
export const ControlStatusTooltips: Record<ControlControlStatus, string> = {
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

export const FilterIcons: Record<ControlsFilterIconName, LucideIcon> = {
  [ControlsFilterIconName.RefCode]: Key,
  [ControlsFilterIconName.Program]: FileText,
  [ControlsFilterIconName.Category]: Folder,
  [ControlsFilterIconName.Subcategory]: FolderTree,
  [ControlsFilterIconName.Status]: CircleDot,
  [ControlsFilterIconName.Standard]: FileBadge2,
  [ControlsFilterIconName.Owners]: UsersRound,
  [ControlsFilterIconName.ProgramName]: ShieldCheck,
  [ControlsFilterIconName.Type]: Tag,
  [ControlsFilterIconName.LinkedPolicies]: Link,
  [ControlsFilterIconName.Comments]: MessageCircle,
}

// Status options for select dropdowns
export const ControlStatusOptions = Object.values(ControlControlStatus).map((status) => ({
  label: ControlStatusLabels[status],
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
  Framework: <FileBadge2 size={16} className="text-brand" />,
  Control: <Settings2 size={16} className="text-brand" />,
  Category: <FolderIcon size={16} className="text-brand" />,
  Subcategory: <FolderIcon size={16} className="text-brand" />,
  Status: <BinocularsIcon size={16} className="text-brand" />,
  'Mapped categories': <FolderSymlink size={16} className="text-brand" />,
  Source: <ArrowUpFromDot size={16} className="text-brand" />,
  Type: <Shapes size={16} className="text-brand" />,
}
