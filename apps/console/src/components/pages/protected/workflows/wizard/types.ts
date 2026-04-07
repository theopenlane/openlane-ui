import type { WorkflowDefinitionWorkflowKind } from '@repo/codegen/src/schema'
import type { WizardActionType, Target } from '../types'
import type { ApprovalSubmissionMode, ApprovalTiming, WorkflowAction, WorkflowCondition, WorkflowDocument, WorkflowTrigger } from '@/types/workflow'

export type { ApprovalSubmissionMode, ApprovalTiming, Target, WorkflowAction, WorkflowCondition, WorkflowDocument, WorkflowTrigger }

export type ConditionOperator = 'eq' | 'neq'

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
