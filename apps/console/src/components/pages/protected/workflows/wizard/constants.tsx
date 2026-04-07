import { WorkflowDefinitionWorkflowKind } from '@repo/codegen/src/schema'
import { Bell, CheckCircle, CircleCheckBig, Webhook, Wrench } from 'lucide-react'
import { WizardActionType } from '../types'
import type { GoalOption } from './types'

export const GOAL_OPTIONS: GoalOption[] = [
  {
    id: 'approval',
    label: 'Request approval',
    description: 'Route changes to approvers before they go live.',
    actionType: WizardActionType.REQUEST_APPROVAL,
    workflowKind: WorkflowDefinitionWorkflowKind.APPROVAL,
    icon: <CircleCheckBig className="text-btn-primary" size={20} />,
  },
  {
    id: 'review',
    label: 'Request review',
    description: 'Collect reviews after the change is applied.',
    actionType: WizardActionType.REQUEST_REVIEW,
    workflowKind: WorkflowDefinitionWorkflowKind.APPROVAL,
    icon: <CheckCircle className="text-btn-primary" size={20} />,
  },
  {
    id: 'notify',
    label: 'Send notification',
    description: 'Notify a person or group when something changes.',
    actionType: WizardActionType.NOTIFY,
    workflowKind: WorkflowDefinitionWorkflowKind.NOTIFICATION,
    icon: <Bell className="text-btn-primary" size={20} />,
  },
  {
    id: 'webhook',
    label: 'Send webhook',
    description: 'Post a payload to an external system.',
    actionType: WizardActionType.WEBHOOK,
    workflowKind: WorkflowDefinitionWorkflowKind.NOTIFICATION,
    icon: <Webhook className="text-btn-primary" size={20} />,
  },
  {
    id: 'field-update',
    label: 'Update a field',
    description: 'Automatically update a field value when triggered.',
    actionType: WizardActionType.UPDATE_FIELD,
    workflowKind: WorkflowDefinitionWorkflowKind.LIFECYCLE,
    icon: <Wrench className="text-btn-primary" size={20} />,
  },
]
