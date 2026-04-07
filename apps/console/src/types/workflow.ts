import type { WorkflowDefinitionWorkflowKind } from '@repo/codegen/src/schema'

export type WorkflowTriggerOperation = 'CREATE' | 'UPDATE' | 'DELETE'

export type ApprovalTiming = 'PRE_COMMIT' | 'POST_COMMIT'
export type ApprovalSubmissionMode = 'AUTO_SUBMIT' | 'MANUAL_SUBMIT'
export type WebhookMethod = 'POST' | 'PUT' | 'PATCH' | 'GET'

export type Target = {
  type: 'USER' | 'GROUP' | 'ROLE' | 'RESOLVER'
  id?: string
  resolver_key?: string
}

export type WorkflowLegacyAssignees = {
  users?: string[]
  groups?: string[]
}

export type WorkflowSelector = {
  tagIds?: string[]
  groupIds?: string[]
  objectTypes?: string[]
}

export type WorkflowTrigger = {
  operation: WorkflowTriggerOperation
  interval?: string
  objectType: string
  fields?: string[]
  edges?: string[]
  expression?: string
  description?: string
  selector?: WorkflowSelector
}

export type WorkflowCondition = {
  expression: string
  description?: string
}

export type WorkflowActionType = 'REQUEST_APPROVAL' | 'REQUEST_REVIEW' | 'NOTIFY' | 'WEBHOOK' | 'UPDATE_FIELD' | 'INTEGRATION' | 'CREATE_OBJECT'

export type WorkflowActionParams = {
  targets?: Target[]
  assignees?: WorkflowLegacyAssignees
  required?: boolean
  required_count?: number
  label?: string
  fields?: string[]
  updates?: Record<string, unknown>
  title?: string
  body?: string
  channels?: string[]
  url?: string
  method?: WebhookMethod
  payload_expr?: string
  payload?: Record<string, unknown>
  [key: string]: unknown
}

export type WorkflowAction = {
  key: string
  type: WorkflowActionType
  description?: string
  when?: string
  params?: WorkflowActionParams
}

export type WorkflowNodeData = WorkflowTrigger | WorkflowCondition | WorkflowAction

export type WorkflowDocument = {
  schemaType?: string
  workflowKind?: WorkflowDefinitionWorkflowKind
  name?: string
  description?: string
  approvalTiming?: ApprovalTiming
  approvalSubmissionMode?: ApprovalSubmissionMode
  version?: string
  targets?: WorkflowSelector
  triggers?: WorkflowTrigger[]
  conditions?: WorkflowCondition[]
  actions?: WorkflowAction[]
  metadata?: Record<string, unknown>
}

export type UpdateWorkflowTrigger = <K extends keyof WorkflowTrigger>(index: number, field: K, value: WorkflowTrigger[K]) => void

export type UpdateWorkflowCondition = <K extends keyof WorkflowCondition>(index: number, field: K, value: WorkflowCondition[K]) => void

export type UpdateWorkflowAction = <K extends keyof WorkflowAction>(index: number, field: K, value: WorkflowAction[K]) => void

export type UpdateWorkflowActionParam = <K extends keyof WorkflowActionParams>(index: number, field: K, value: WorkflowActionParams[K]) => void
