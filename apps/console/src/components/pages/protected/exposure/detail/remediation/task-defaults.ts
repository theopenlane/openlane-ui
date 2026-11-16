import { TaskTaskStatus } from '@repo/codegen/src/schema'

export const buildExposureTaskDefaults = (kind: 'Vulnerability' | 'Finding', title: string, assigneeID: string | undefined) => ({
  title: `${kind}: ${title} Remediation`,
  taskKindName: `${kind} Remediation`,
  assigneeID,
  status: TaskTaskStatus.OPEN,
})
