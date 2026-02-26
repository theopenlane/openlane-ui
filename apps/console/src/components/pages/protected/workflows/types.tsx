export enum WizardActionType {
  REQUEST_APPROVAL = 'REQUEST_APPROVAL',
  REVIEW = 'REVIEW',
  NOTIFY = 'NOTIFY',
  WEBHOOK = 'WEBHOOK',
  FIELD_UPDATE = 'FIELD_UPDATE',
}

export const ACTION_LABELS: Record<WizardActionType, string> = {
  [WizardActionType.REQUEST_APPROVAL]: 'Approval',
  [WizardActionType.REVIEW]: 'Review',
  [WizardActionType.NOTIFY]: 'Notification',
  [WizardActionType.WEBHOOK]: 'Webhook',
  [WizardActionType.FIELD_UPDATE]: 'Field update',
}

export const WEBHOOK_METHOD_OPTIONS = ['POST', 'PUT', 'PATCH', 'GET']
