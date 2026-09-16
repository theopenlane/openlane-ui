import { ControlControlStatus, EvidenceEvidenceStatus, InternalPolicyDocumentStatus, ProcedureDocumentStatus, TaskTaskStatus } from '@repo/codegen/src/schema'

export enum WorkStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  COMPLETED = 'COMPLETED',
}

export const WORK_STATUS_ORDER: readonly WorkStatus[] = [WorkStatus.OPEN, WorkStatus.IN_PROGRESS, WorkStatus.IN_REVIEW, WorkStatus.COMPLETED]

export const OUTSTANDING_WORK_STATUSES: readonly WorkStatus[] = WORK_STATUS_ORDER.filter((status) => status !== WorkStatus.COMPLETED)

export const WORK_STATUS_DOT_CLASS: Record<WorkStatus, string> = {
  [WorkStatus.OPEN]: 'bg-open',
  [WorkStatus.IN_PROGRESS]: 'bg-in-progress',
  [WorkStatus.IN_REVIEW]: 'bg-in-review',
  [WorkStatus.COMPLETED]: 'bg-completed',
}

export const TASK_WORK_STATUS: Record<TaskTaskStatus, WorkStatus> = {
  [TaskTaskStatus.OPEN]: WorkStatus.OPEN,
  [TaskTaskStatus.IN_PROGRESS]: WorkStatus.IN_PROGRESS,
  [TaskTaskStatus.IN_REVIEW]: WorkStatus.IN_REVIEW,
  [TaskTaskStatus.COMPLETED]: WorkStatus.COMPLETED,
  [TaskTaskStatus.WONT_DO]: WorkStatus.COMPLETED,
}

export const CONTROL_WORK_STATUS: Record<ControlControlStatus, WorkStatus> = {
  [ControlControlStatus.NOT_IMPLEMENTED]: WorkStatus.OPEN,
  [ControlControlStatus.PREPARING]: WorkStatus.IN_PROGRESS,
  [ControlControlStatus.CHANGES_REQUESTED]: WorkStatus.IN_PROGRESS,
  [ControlControlStatus.DRAFT]: WorkStatus.IN_PROGRESS,
  [ControlControlStatus.NEEDS_APPROVAL]: WorkStatus.IN_REVIEW,
  [ControlControlStatus.APPROVED]: WorkStatus.COMPLETED,
  [ControlControlStatus.ARCHIVED]: WorkStatus.COMPLETED,
  [ControlControlStatus.NOT_APPLICABLE]: WorkStatus.COMPLETED,
}

export const EVIDENCE_WORK_STATUS: Record<EvidenceEvidenceStatus, WorkStatus> = {
  [EvidenceEvidenceStatus.REQUESTED]: WorkStatus.OPEN,
  [EvidenceEvidenceStatus.NEEDS_RENEWAL]: WorkStatus.OPEN,
  [EvidenceEvidenceStatus.DRAFT]: WorkStatus.IN_PROGRESS,
  [EvidenceEvidenceStatus.MISSING_ARTIFACT]: WorkStatus.IN_PROGRESS,
  [EvidenceEvidenceStatus.REJECTED]: WorkStatus.IN_PROGRESS,
  [EvidenceEvidenceStatus.SUBMITTED]: WorkStatus.IN_REVIEW,
  [EvidenceEvidenceStatus.IN_REVIEW]: WorkStatus.IN_REVIEW,
  [EvidenceEvidenceStatus.READY_FOR_AUDITOR]: WorkStatus.COMPLETED,
  [EvidenceEvidenceStatus.AUDITOR_APPROVED]: WorkStatus.COMPLETED,
}

export const POLICY_WORK_STATUS: Record<InternalPolicyDocumentStatus, WorkStatus> = {
  [InternalPolicyDocumentStatus.DRAFT]: WorkStatus.IN_PROGRESS,
  [InternalPolicyDocumentStatus.NEEDS_APPROVAL]: WorkStatus.IN_REVIEW,
  [InternalPolicyDocumentStatus.PENDING]: WorkStatus.IN_REVIEW,
  [InternalPolicyDocumentStatus.APPROVED]: WorkStatus.COMPLETED,
  [InternalPolicyDocumentStatus.PUBLISHED]: WorkStatus.COMPLETED,
  [InternalPolicyDocumentStatus.ARCHIVED]: WorkStatus.COMPLETED,
}

export const PROCEDURE_WORK_STATUS: Record<ProcedureDocumentStatus, WorkStatus> = {
  [ProcedureDocumentStatus.DRAFT]: WorkStatus.IN_PROGRESS,
  [ProcedureDocumentStatus.NEEDS_APPROVAL]: WorkStatus.IN_REVIEW,
  [ProcedureDocumentStatus.PENDING]: WorkStatus.IN_REVIEW,
  [ProcedureDocumentStatus.APPROVED]: WorkStatus.COMPLETED,
  [ProcedureDocumentStatus.PUBLISHED]: WorkStatus.COMPLETED,
  [ProcedureDocumentStatus.ARCHIVED]: WorkStatus.COMPLETED,
}

export const sourceStatusesFor = <TSourceStatus extends string>(map: Record<TSourceStatus, WorkStatus>, workStatuses: readonly WorkStatus[]): TSourceStatus[] => {
  const wanted = new Set(workStatuses)
  return (Object.keys(map) as TSourceStatus[]).filter((sourceStatus) => wanted.has(map[sourceStatus]))
}
