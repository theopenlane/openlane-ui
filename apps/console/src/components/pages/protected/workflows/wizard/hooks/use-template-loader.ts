import { useEffect, useMemo, useState } from 'react'
import { getWorkflowTemplateById } from '@/lib/workflow-templates'
import { WorkflowDefinitionWorkflowKind } from '@repo/codegen/src/schema'
import { WizardActionType } from '../../types'
import type { Target } from '../types'
import { parseDefinitionJSON, normalizeApprovalTiming, isPlaceholderValue, sanitizeTargets } from '../utils'
import type { WizardState } from './use-wizard-state'

type UseTemplateLoaderParams = {
  templateId: string | null
  state: WizardState
  goToStep: (id: string) => void
}

export const useTemplateLoader = ({ templateId, state, goToStep }: UseTemplateLoaderParams) => {
  const [templateLoaded, setTemplateLoaded] = useState(false)

  const template = useMemo(() => (templateId ? getWorkflowTemplateById(templateId) : undefined), [templateId])

  const templateSchemaType = useMemo(() => {
    if (!template) return ''
    const doc = parseDefinitionJSON(template.definitionJSON)
    return (doc?.schemaType as string) || template.schemaType || ''
  }, [template])

  useEffect(() => {
    if (templateId) {
      if (!templateLoaded) return
      if (templateSchemaType && state.schemaType === templateSchemaType) return
    }
    state.setOperationPicked(false)
    state.setActionType(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.schemaType, templateId, templateLoaded, templateSchemaType])

  useEffect(() => {
    setTemplateLoaded(false)
  }, [templateId])

  useEffect(() => {
    if (!template || templateLoaded) return

    const document = parseDefinitionJSON(template.definitionJSON)
    const trigger = Array.isArray(document?.triggers) && document.triggers.length > 0 ? document.triggers[0] : ({} as Record<string, unknown>)
    const conditions = Array.isArray(document?.conditions) ? document.conditions : []
    const action =
      Array.isArray(document?.actions) && document.actions.length > 0
        ? (document.actions[0] as Record<string, unknown>)
        : document?.actions && typeof document.actions === 'object'
          ? (document.actions as Record<string, unknown>)
          : undefined

    const schema = (document?.schemaType as string) || template.schemaType || ''
    const normalizedOperation = ((trigger?.operation as string) || 'UPDATE').toUpperCase()

    state.setSchemaType(schema)
    state.setOperation(normalizedOperation as 'CREATE' | 'UPDATE' | 'DELETE')
    state.setOperationPicked(true)

    const triggerFields = Array.isArray(trigger?.fields) ? (trigger.fields as string[]).filter(Boolean) : []
    state.setFieldScope(triggerFields.length > 0 ? 'specific' : 'any')
    state.setTrackedFields(triggerFields)
    state.setEdges(Array.isArray(trigger?.edges) ? (trigger.edges as string[]).filter(Boolean) : [])

    if (conditions.length > 0 && conditions[0]?.expression) {
      state.setConditionEnabled(true)
      state.setConditionUseCel(true)
      state.setConditionExpression(conditions[0].expression)
    } else {
      state.setConditionEnabled(false)
      state.setConditionExpression('')
    }

    const resolvedKind =
      (document?.workflowKind as WorkflowDefinitionWorkflowKind) || (template.definitionJSON?.workflowKind as WorkflowDefinitionWorkflowKind) || WorkflowDefinitionWorkflowKind.APPROVAL
    state.setWorkflowKind(resolvedKind)
    state.setApprovalTiming(normalizeApprovalTiming(document?.approvalTiming))

    state.setName(document?.name ?? template.name ?? '')
    state.setDescription(document?.description ?? template.description ?? '')

    const actionTypeRaw = (action?.type as string) || ''
    const ACTION_TYPE_ALIASES: Record<string, string> = { APPROVAL: WizardActionType.REQUEST_APPROVAL, REVIEW: WizardActionType.REQUEST_REVIEW, FIELD_UPDATE: WizardActionType.UPDATE_FIELD }
    const actionTypeNormalized = ACTION_TYPE_ALIASES[actionTypeRaw] ?? actionTypeRaw
    let shouldJumpToConfigure = false

    state.setActionType(actionTypeNormalized as WizardActionType)

    const actionParams = action?.params as Record<string, unknown> | undefined

    switch (actionTypeNormalized) {
      case WizardActionType.REQUEST_APPROVAL:
      case WizardActionType.REQUEST_REVIEW: {
        const rawTargets = Array.isArray(actionParams?.targets) ? (actionParams.targets as Target[]) : []
        const sanitizedTargets = sanitizeTargets(rawTargets)
        state.setTargets(sanitizedTargets)
        state.setApprovalLabel((actionParams?.label as string) ?? '')
        state.setRequiredCount((actionParams?.required_count as number) ?? 1)
        shouldJumpToConfigure = sanitizedTargets.length === 0
        break
      }
      case WizardActionType.NOTIFY: {
        const rawTargets = Array.isArray(actionParams?.targets) ? (actionParams.targets as Target[]) : []
        const sanitizedTargets = sanitizeTargets(rawTargets)
        state.setTargets(sanitizedTargets)
        state.setNotificationTitle((actionParams?.title as string) ?? '')
        state.setNotificationBody((actionParams?.body as string) ?? '')
        state.setNotificationChannels((actionParams?.channels as string[]) ?? ['IN_APP'])
        shouldJumpToConfigure = sanitizedTargets.length === 0
        break
      }
      case WizardActionType.WEBHOOK: {
        const urlValue = (actionParams?.url as string) ?? ''
        state.setWebhookUrl(isPlaceholderValue(urlValue) ? '' : urlValue)
        state.setWebhookMethod((actionParams?.method as string) ?? 'POST')
        state.setWebhookPayload(actionParams?.payload ? JSON.stringify(actionParams.payload, null, 2) : '')
        shouldJumpToConfigure = isPlaceholderValue(urlValue) || !urlValue
        break
      }
      case WizardActionType.UPDATE_FIELD: {
        const updates = (actionParams?.updates as Record<string, unknown>) ?? {}
        const [field, value] = Object.entries(updates)[0] ?? []
        if (field) state.setFieldUpdateField(field)
        if (value !== undefined) {
          state.setFieldUpdateValue(typeof value === 'string' ? value : JSON.stringify(value))
        }
        break
      }
    }

    setTemplateLoaded(true)
    requestAnimationFrame(() => goToStep(shouldJumpToConfigure ? 'configure' : 'review'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, templateLoaded, goToStep])

  return { template }
}
