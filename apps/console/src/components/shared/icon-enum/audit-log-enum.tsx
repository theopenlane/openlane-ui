import { FilePenLine, FilePlus2, FileX2 } from 'lucide-react'
import React from 'react'

export enum AuditLogOperator {
  DELETE = 'Delete',
  UPDATE = 'Update',
  INSERT = 'Create',
}

export const AuditLogOperatorMapper: Record<keyof typeof AuditLogOperator, React.ReactNode> = {
  INSERT: <FilePlus2 size={16} className="text-accent-secondary" />,
  DELETE: <FileX2 size={16} className="text-accent-secondary" />,
  UPDATE: <FilePenLine size={16} className="text-accent-secondary" />,
}
