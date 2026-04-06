import type { WebhookMethod } from '@/types/workflow'

export enum WizardActionType {
  REQUEST_APPROVAL = 'REQUEST_APPROVAL',
  REQUEST_REVIEW = 'REQUEST_REVIEW',
  NOTIFY = 'NOTIFY',
  WEBHOOK = 'WEBHOOK',
  UPDATE_FIELD = 'UPDATE_FIELD',
}

export const ACTION_LABELS: Record<WizardActionType, string> = {
  [WizardActionType.REQUEST_APPROVAL]: 'Approval',
  [WizardActionType.REQUEST_REVIEW]: 'Review',
  [WizardActionType.NOTIFY]: 'Notification',
  [WizardActionType.WEBHOOK]: 'Webhook',
  [WizardActionType.UPDATE_FIELD]: 'Field update',
}

export type {
  ApprovalSubmissionMode,
  ApprovalTiming,
  Target,
  WebhookMethod,
  WorkflowAction,
  WorkflowActionParams,
  WorkflowActionType,
  WorkflowCondition,
  WorkflowDocument,
  WorkflowNodeData,
  WorkflowTrigger,
  WorkflowTriggerOperation,
} from '@/types/workflow'

export const WEBHOOK_METHOD_OPTIONS: WebhookMethod[] = ['POST', 'PUT', 'PATCH', 'GET']
