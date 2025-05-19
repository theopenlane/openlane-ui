import { Archive, FileCheck2, FilePen, ScanEye, Stamp } from 'lucide-react'
import { InternalPolicyDocumentStatus, ProcedureDocumentStatus } from '@repo/codegen/src/schema.ts'

export const DocumentIconMapper: Record<InternalPolicyDocumentStatus | ProcedureDocumentStatus, React.ReactNode> = {
  [InternalPolicyDocumentStatus.APPROVED]: <Stamp height={16} width={16} />,
  [InternalPolicyDocumentStatus.DRAFT]: <FilePen height={16} width={16} />,
  [InternalPolicyDocumentStatus.NEEDS_APPROVAL]: <ScanEye height={16} width={16} />,
  [InternalPolicyDocumentStatus.PUBLISHED]: <FileCheck2 height={16} width={16} />,
  [InternalPolicyDocumentStatus.ARCHIVED]: <Archive height={16} width={16} />,
}
