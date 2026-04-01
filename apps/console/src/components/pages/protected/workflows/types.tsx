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

export const WEBHOOK_METHOD_OPTIONS = ['POST', 'PUT', 'PATCH', 'GET']

export type Target = {
  type: 'USER' | 'GROUP' | 'ROLE' | 'RESOLVER'
  id?: string
  resolver_key?: string
}
