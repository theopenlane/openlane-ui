import type { WorkflowDefinitionWorkflowKind } from '@repo/codegen/src/schema'
import type { WizardActionType, Target } from '../types'

export type { Target }

export type WorkflowDocument = {
  schemaType?: string
  workflowKind?: WorkflowDefinitionWorkflowKind
  name?: string
  conditions?: { expression: string; description: string }[]
  actions?: Record<string, unknown> | null
  description?: string
  approvalTiming?: ApprovalTiming
  approvalSubmissionMode?: ApprovalSubmissionMode
  triggers?: Array<Record<string, unknown>>
}

export type ConditionOperator = 'eq' | 'neq'

export type ApprovalTiming = 'PRE_COMMIT' | 'POST_COMMIT'
export type ApprovalSubmissionMode = 'AUTO_SUBMIT' | 'MANUAL_SUBMIT'

export type GoalOption = {
  id: string
  label: string
  description: string
  actionType: keyof typeof WizardActionType
  workflowKind: WorkflowDefinitionWorkflowKind
  icon: React.ReactElement
}

export type TargetSelectorProps = {
  targets: Target[]
  onAdd: (target: Target) => void
  onRemove: (target: Target) => void
  resolverKeys: string[]
  getTargetLabel: (target: Target) => string
  error?: string | null
}

export type FlowSummaryProps = {
  objectLabel?: string
  operationLabel?: string
  actionLabel?: string
}
