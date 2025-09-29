import { Archive, FileCheck2, FilePen, ScanEye, Stamp } from 'lucide-react'
import { InternalPolicyDocumentStatus, ProcedureDocumentStatus } from '@repo/codegen/src/schema.ts'
import { Badge } from '@repo/ui/badge'

export const DocumentIconMapper: Record<InternalPolicyDocumentStatus | ProcedureDocumentStatus, React.ReactNode> = {
  [InternalPolicyDocumentStatus.APPROVED]: <Stamp height={16} width={16} />,
  [InternalPolicyDocumentStatus.DRAFT]: <FilePen height={16} width={16} />,
  [InternalPolicyDocumentStatus.NEEDS_APPROVAL]: <ScanEye height={16} width={16} />,
  [InternalPolicyDocumentStatus.PUBLISHED]: <FileCheck2 height={16} width={16} />,
  [InternalPolicyDocumentStatus.ARCHIVED]: <Archive height={16} width={16} />,
}

export const DocumentStatusMapper: Record<InternalPolicyDocumentStatus | ProcedureDocumentStatus, string> = {
  [InternalPolicyDocumentStatus.APPROVED]: 'Approved',
  [InternalPolicyDocumentStatus.DRAFT]: 'Draft',
  [InternalPolicyDocumentStatus.NEEDS_APPROVAL]: 'Needs Approval',
  [InternalPolicyDocumentStatus.PUBLISHED]: 'Published',
  [InternalPolicyDocumentStatus.ARCHIVED]: 'Archived',
}

const DocumentStatusColorMapper: Record<InternalPolicyDocumentStatus | ProcedureDocumentStatus, string> = {
  [InternalPolicyDocumentStatus.DRAFT]: 'text-document-draft bg-document-draft-muted border-document-draft-border',
  [InternalPolicyDocumentStatus.APPROVED]: 'text-document-approved bg-document-approved-muted border-document-approved-border',
  [InternalPolicyDocumentStatus.NEEDS_APPROVAL]: 'text-document-needs-approval bg-document-needs-approval-muted border-document-needs-approval-border',
  [InternalPolicyDocumentStatus.PUBLISHED]: 'text-document-published bg-document-published-muted border-document-published-border',
  [InternalPolicyDocumentStatus.ARCHIVED]: 'text-document-archived bg-document-archived-muted border-document-archived-border',
}

export function DocumentStatusBadge({ status }: { status: InternalPolicyDocumentStatus | ProcedureDocumentStatus }) {
  return (
    <Badge variant="outline" className={`flex items-center text-center gap-2 ${DocumentStatusColorMapper[status]}`}>
      {DocumentStatusMapper[status]}
    </Badge>
  )
}

export const DocumentStatusTooltips: Record<InternalPolicyDocumentStatus | ProcedureDocumentStatus, string> = {
  [InternalPolicyDocumentStatus.APPROVED]: 'The document has been approved by the a user, it needs to be published to be used within the program.',
  [InternalPolicyDocumentStatus.DRAFT]: 'The document is a draft and has not been approved.',
  [InternalPolicyDocumentStatus.NEEDS_APPROVAL]: 'The document needs approval from the approver group.',
  [InternalPolicyDocumentStatus.PUBLISHED]: 'The document has been published and the active version used within the organization.',
  [InternalPolicyDocumentStatus.ARCHIVED]: 'The document has been archived and is no longer available.',
}

// Status options for select dropdowns
export const InternalPolicyStatusOptions = Object.values(InternalPolicyDocumentStatus).map((value) => ({
  label: value
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' '),
  value,
}))

export const ProcedureStatusOptions = Object.values(ProcedureDocumentStatus).map((value) => ({
  label: value
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' '),
  value,
}))

// Status options for table filters (using Object.entries for key-value pairs)
export const InternalPolicyStatusFilterOptions = Object.entries(InternalPolicyDocumentStatus).map(([key, value]) => ({
  label: key
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase()),
  value,
}))

export const ProcedureStatusFilterOptions = Object.entries(ProcedureDocumentStatus).map(([key, value]) => ({
  label: key
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase()),
  value,
}))
