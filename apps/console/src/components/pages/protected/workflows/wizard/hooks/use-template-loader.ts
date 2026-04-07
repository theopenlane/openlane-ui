import { useEffect, useMemo, useRef, useState } from 'react'
import { getWorkflowTemplateById } from '@/lib/workflow-templates'
import { WorkflowDefinitionWorkflowKind } from '@repo/codegen/src/schema'
import { WizardActionType } from '../../types'
import { parseDefinitionJSON, normalizeApprovalTiming, isPlaceholderValue, sanitizeTargets } from '../utils'
import type { WizardState } from './use-wizard-state'

type UseTemplateLoaderParams = {
  templateId: string | null
  state: WizardState
  goToStep: (id: string) => void
}

export const useTemplateLoader = ({ templateId, state, goToStep }: UseTemplateLoaderParams) => {
  const [templateLoaded, setTemplateLoaded] = useState(false)

  const { schemaType, setOperationPicked, setActionType } = state

  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  const template = useMemo(() => (templateId ? getWorkflowTemplateById(templateId) : undefined), [templateId])

  const templateSchemaType = useMemo(() => {
    if (!template) return ''
    const doc = parseDefinitionJSON(template.definitionJSON)
    return (doc?.schemaType as string) || template.schemaType || ''
  }, [template])

  useEffect(() => {
    if (templateId) {
      if (!templateLoaded) return
      if (templateSchemaType && schemaType === templateSchemaType) return
    }
    setOperationPicked(false)
    setActionType(null)
  }, [schemaType, templateId, templateLoaded, templateSchemaType, setOperationPicked, setActionType])

  useEffect(() => {
    setTemplateLoaded(false)
  }, [templateId])

  useEffect(() => {
    if (!template || templateLoaded) return

    const s = stateRef.current
    const document = parseDefinitionJSON(template.definitionJSON)
    const trigger = document.triggers?.[0]
    const conditions = document.conditions ?? []
    const action = document.actions?.[0]

    const schema = document.schemaType || template.schemaType || ''
    const normalizedOperation = (trigger?.operation || 'UPDATE').toUpperCase()

    s.setSchemaType(schema)
    s.setOperation(normalizedOperation as 'CREATE' | 'UPDATE' | 'DELETE')
    s.setOperationPicked(true)

    const triggerFields = trigger?.fields?.filter(Boolean) ?? []
    s.setFieldScope(triggerFields.length > 0 ? 'specific' : 'any')
    s.setTrackedFields(triggerFields)
    s.setEdges(trigger?.edges?.filter(Boolean) ?? [])

    if (conditions.length > 0 && conditions[0]?.expression) {
      s.setConditionEnabled(true)
      s.setConditionUseCel(true)
      s.setConditionExpression(conditions[0].expression)
    } else {
      s.setConditionEnabled(false)
      s.setConditionExpression('')
    }

    const resolvedKind =
      (document?.workflowKind as WorkflowDefinitionWorkflowKind) || (template.definitionJSON?.workflowKind as WorkflowDefinitionWorkflowKind) || WorkflowDefinitionWorkflowKind.APPROVAL
    s.setWorkflowKind(resolvedKind)
    s.setApprovalTiming(normalizeApprovalTiming(document?.approvalTiming))

    s.setName(document?.name ?? template.name ?? '')
    s.setDescription(document?.description ?? template.description ?? '')

    const actionTypeRaw = action?.type || ''
    const ACTION_TYPE_ALIASES: Record<string, string> = { APPROVAL: WizardActionType.REQUEST_APPROVAL, REVIEW: WizardActionType.REQUEST_REVIEW, FIELD_UPDATE: WizardActionType.UPDATE_FIELD }
    const actionTypeNormalized = ACTION_TYPE_ALIASES[actionTypeRaw] ?? actionTypeRaw
    let shouldJumpToConfigure = false

    s.setActionType(actionTypeNormalized as WizardActionType)

    const actionParams = action?.params

    switch (actionTypeNormalized) {
      case WizardActionType.REQUEST_APPROVAL:
      case WizardActionType.REQUEST_REVIEW: {
        const rawTargets = actionParams?.targets ?? []
        const sanitizedTargets = sanitizeTargets(rawTargets)
        s.setTargets(sanitizedTargets)
        s.setApprovalLabel(actionParams?.label ?? '')
        s.setRequiredCount(actionParams?.required_count ?? 1)
        shouldJumpToConfigure = sanitizedTargets.length === 0
        break
      }
      case WizardActionType.NOTIFY: {
        const rawTargets = actionParams?.targets ?? []
        const sanitizedTargets = sanitizeTargets(rawTargets)
        s.setTargets(sanitizedTargets)
        s.setNotificationTitle(actionParams?.title ?? '')
        s.setNotificationBody(actionParams?.body ?? '')
        s.setNotificationChannels(actionParams?.channels ?? ['IN_APP'])
        shouldJumpToConfigure = sanitizedTargets.length === 0
        break
      }
      case WizardActionType.WEBHOOK: {
        const urlValue = actionParams?.url ?? ''
        s.setWebhookUrl(isPlaceholderValue(urlValue) ? '' : urlValue)
        s.setWebhookMethod(actionParams?.method ?? 'POST')
        s.setWebhookPayload(actionParams?.payload ? JSON.stringify(actionParams.payload, null, 2) : '')
        shouldJumpToConfigure = isPlaceholderValue(urlValue) || !urlValue
        break
      }
      case WizardActionType.UPDATE_FIELD: {
        const updates = (actionParams?.updates as Record<string, unknown>) ?? {}
        const [field, value] = Object.entries(updates)[0] ?? []
        if (field) s.setFieldUpdateField(field)
        if (value !== undefined) {
          s.setFieldUpdateValue(typeof value === 'string' ? value : JSON.stringify(value))
        }
        break
      }
    }

    setTemplateLoaded(true)
    requestAnimationFrame(() => goToStep(shouldJumpToConfigure ? 'configure' : 'review'))
  }, [template, templateLoaded, goToStep])

  return { template }
}
