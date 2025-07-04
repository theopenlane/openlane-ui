import { FileCheck2, FilePen, ScanEye, Stamp } from 'lucide-react'

export enum AuditLogOperator {
  CREATE = 'Create',
  DELETE = 'Delete',
  UPDATE = 'Update',
  INSERT = 'Insert',
}

export const AuditLogOperatorMapper: Record<AuditLogOperator, React.ReactNode> = {
  [AuditLogOperator.CREATE]: <Stamp height={16} width={16} />,
  [AuditLogOperator.DELETE]: <FilePen height={16} width={16} />,
  [AuditLogOperator.UPDATE]: <ScanEye height={16} width={16} />,
  [AuditLogOperator.INSERT]: <FileCheck2 height={16} width={16} />,
}
