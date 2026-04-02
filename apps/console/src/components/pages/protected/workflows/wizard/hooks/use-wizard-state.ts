import { useEffect, useMemo, useState } from 'react'
import { WorkflowDefinitionWorkflowKind } from '@repo/codegen/src/schema'
import { TRIGGER_OPERATION_OPTIONS, WORKFLOW_TEMPLATES } from '@/lib/workflow-templates'
import type { WorkflowObjectTypeMetadata } from '@/lib/graphql-hooks/workflows'
import type { WorkflowDefinitionsNodeNonNull } from '@/lib/graphql-hooks/workflow-definition'
import { WizardActionType, ACTION_LABELS } from '../../types'
import type { Target, ConditionOperator, ApprovalTiming, GoalOption } from '../types'
import { buildConditionExpression, buildTargetKey, formatResolverLabel, parseDefinitionJSON, DEFAULT_VERSION, DEFAULT_APPROVAL_TIMING, DEFAULT_APPROVAL_SUBMISSION_MODE } from '../utils'
import type { WorkflowDocument } from '../types'

type UseWizardStateParams = {
  objectTypes: WorkflowObjectTypeMetadata[]
  workflowDefinitionsNodes: WorkflowDefinitionsNodeNonNull[]
  userOptions: { label: string; value: string }[]
  groupOptions: { label: string; value: string }[]
}

export const useWizardState = ({ objectTypes, workflowDefinitionsNodes, userOptions, groupOptions }: UseWizardStateParams) => {
  const [actionType, setActionType] = useState<keyof typeof WizardActionType | null>(null)
  const [workflowKind, setWorkflowKind] = useState<WorkflowDefinitionWorkflowKind>(WorkflowDefinitionWorkflowKind.APPROVAL)
  const [approvalTiming, setApprovalTiming] = useState<ApprovalTiming>(DEFAULT_APPROVAL_TIMING)
  const [schemaType, setSchemaType] = useState('')
  const [operation, setOperation] = useState<'CREATE' | 'UPDATE' | 'DELETE'>('UPDATE')
  const [operationPicked, setOperationPicked] = useState(false)
  const [fieldScope, setFieldScope] = useState<'any' | 'specific'>('any')
  const [trackedFields, setTrackedFields] = useState<string[]>([])
  const [edges, setEdges] = useState<string[]>([])
  const [edgeInput, setEdgeInput] = useState('')
  const [edgeSelect, setEdgeSelect] = useState('')
  const [conditionEnabled, setConditionEnabled] = useState(false)
  const [conditionUseCel, setConditionUseCel] = useState(false)
  const [conditionField, setConditionField] = useState('')
  const [conditionOperator, setConditionOperator] = useState<ConditionOperator>('eq')
  const [conditionValue, setConditionValue] = useState('')
  const [conditionExpression, setConditionExpression] = useState('')

  const [targets, setTargets] = useState<Target[]>([])
  const [approvalLabel, setApprovalLabel] = useState('')
  const [requiredCount, setRequiredCount] = useState(1)
  const [notificationTitle, setNotificationTitle] = useState('')
  const [notificationBody, setNotificationBody] = useState('')
  const [notificationChannels, setNotificationChannels] = useState<string[]>(['IN_APP'])
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookMethod, setWebhookMethod] = useState('POST')
  const [webhookPayload, setWebhookPayload] = useState('')
  const [fieldUpdateField, setFieldUpdateField] = useState('')
  const [fieldUpdateValue, setFieldUpdateValue] = useState('')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [active, setActive] = useState(true)
  const [draft, setDraft] = useState(true)
  const [isDefault, setIsDefault] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  useEffect(() => {
    if (fieldScope === 'any') {
      setTrackedFields([])
    }
  }, [fieldScope])

  useEffect(() => {
    setEdgeSelect('')
  }, [schemaType])

  useEffect(() => {
    if (!conditionEnabled || !schemaType) return
    if (!conditionField) {
      const selected = objectTypes.find((obj) => obj.type === schemaType)
      if (selected?.eligibleFields?.length) {
        setConditionField(selected.eligibleFields[0].name)
      }
    }
  }, [conditionEnabled, conditionField, objectTypes, schemaType])

  const selectedObject = useMemo(() => objectTypes.find((obj) => obj.type === schemaType), [objectTypes, schemaType])

  const objectLabel = selectedObject?.label ?? schemaType
  const selectedActionLabel = actionType ? ACTION_LABELS[actionType] : ''

  const eligibleFields = useMemo(() => selectedObject?.eligibleFields ?? [], [selectedObject])
  const resolverKeys = useMemo(() => selectedObject?.resolverKeys ?? [], [selectedObject])

  const sortedObjectTypes = useMemo(() => {
    return [...objectTypes].sort((a, b) => (a.label || a.type).localeCompare(b.label || b.type))
  }, [objectTypes])

  const edgeOptions = useMemo(() => {
    if (!schemaType) return []
    const edgesSet = new Set<string>()

    const selectedMetadata = objectTypes.find((obj) => obj.type === schemaType)
    selectedMetadata?.eligibleEdges?.forEach((edge) => {
      if (edge) edgesSet.add(edge)
    })

    const addEdgesFromDoc = (doc: WorkflowDocument, fallbackSchemaType?: string) => {
      if (!Array.isArray(doc?.triggers)) return
      doc.triggers.forEach((trigger) => {
        if (!trigger) return
        const objectType = (trigger.objectType as string) || fallbackSchemaType
        if (schemaType && objectType && objectType !== schemaType) return
        const triggerEdges = Array.isArray(trigger.edges) ? (trigger.edges as string[]) : []
        triggerEdges.forEach((edge: string) => {
          if (edge) edgesSet.add(edge)
        })
      })
    }

    if (workflowDefinitionsNodes.length > 0) {
      workflowDefinitionsNodes.forEach((definition: WorkflowDefinitionsNodeNonNull) => {
        if (!definition) return
        const doc: WorkflowDocument = parseDefinitionJSON(definition.definitionJSON)
        addEdgesFromDoc(doc, definition.schemaType ?? undefined)
      })
    }

    WORKFLOW_TEMPLATES.forEach((template) => {
      if (schemaType && template.schemaType !== schemaType) return
      const doc = parseDefinitionJSON(template.definitionJSON)
      addEdgesFromDoc(doc, template.schemaType)
    })

    edges.forEach((edge) => edgesSet.add(edge))

    return Array.from(edgesSet).sort((a, b) => a.localeCompare(b))
  }, [workflowDefinitionsNodes, edges, objectTypes, schemaType])

  const hasEdgeOptions = edgeOptions.length > 0

  const operationLabel = useMemo(() => {
    if (!operationPicked) return ''
    return TRIGGER_OPERATION_OPTIONS.find((opt) => opt.value === operation)?.label ?? operation
  }, [operation, operationPicked])

  const suggestedName = useMemo(() => {
    if (!actionType || !objectLabel || !operationLabel) return ''
    return `${objectLabel} ${operationLabel} ${ACTION_LABELS[actionType]}`
  }, [actionType, objectLabel, operationLabel])

  const parsedWebhookPayload = useMemo(() => {
    if (!webhookPayload.trim()) return {}
    try {
      return JSON.parse(webhookPayload)
    } catch {
      return null
    }
  }, [webhookPayload])

  const webhookPayloadError = useMemo(() => {
    if (!webhookPayload.trim()) return null
    return parsedWebhookPayload === null ? 'Invalid JSON payload' : null
  }, [parsedWebhookPayload, webhookPayload])

  const conditionExpressionFinal = useMemo(() => {
    return buildConditionExpression({
      enabled: conditionEnabled,
      useCel: conditionUseCel,
      field: conditionField,
      operator: conditionOperator,
      value: conditionValue,
      celExpression: conditionExpression,
    })
  }, [conditionEnabled, conditionUseCel, conditionField, conditionOperator, conditionValue, conditionExpression])

  const userLabels = useMemo(() => new Map(userOptions.map((option) => [option.value, option.label])), [userOptions])
  const groupLabels = useMemo(() => new Map(groupOptions.map((option) => [option.value, option.label])), [groupOptions])
  const resolverLabels = useMemo(() => new Map(resolverKeys.map((key) => [key, formatResolverLabel(key)])), [resolverKeys])

  const addTarget = (target: Target) => {
    setTargets((prev) => {
      const exists = prev.some((item) => buildTargetKey(item) === buildTargetKey(target))
      if (exists) return prev
      return [...prev, target]
    })
  }

  const removeTarget = (target: Target) => {
    setTargets((prev) => prev.filter((item) => buildTargetKey(item) !== buildTargetKey(target)))
  }

  const getTargetLabel = (target: Target) => {
    if (target.type === 'USER') return userLabels.get(target.id ?? '') ?? target.id ?? 'User'
    if (target.type === 'GROUP') return groupLabels.get(target.id ?? '') ?? target.id ?? 'Group'
    if (target.type === 'RESOLVER' && target.resolver_key) return resolverLabels.get(target.resolver_key) ?? formatResolverLabel(target.resolver_key)
    return target.type
  }

  const handleSelectGoal = (option: GoalOption) => {
    setActionType(option.actionType)
    setWorkflowKind(option.workflowKind)
  }

  const toggleTrackedField = (fieldName: string, checked: boolean) => {
    setTrackedFields((prev) => {
      if (checked) return [...prev, fieldName]
      return prev.filter((field) => field !== fieldName)
    })
  }

  const addEdge = () => {
    const sourceValue = hasEdgeOptions ? edgeSelect : edgeInput
    const trimmed = sourceValue.trim()
    if (!trimmed) return
    setEdges((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]))
    setEdgeInput('')
    setEdgeSelect('')
  }

  const removeEdge = (edge: string) => {
    setEdges((prev) => prev.filter((item) => item !== edge))
  }

  const toggleChannel = (channel: string, checked: boolean) => {
    setNotificationChannels((prev) => {
      if (checked) return [...prev, channel]
      return prev.filter((item) => item !== channel)
    })
  }

  const buildWorkflowDocument = () => {
    const triggerLabel = operationLabel || operation
    const trigger: Record<string, unknown> = {
      operation,
      objectType: schemaType,
      fields: fieldScope === 'specific' ? trackedFields : [],
      edges,
      description: `${triggerLabel} ${objectLabel}`,
    }

    const conditions = conditionExpressionFinal
      ? [
          {
            expression: conditionExpressionFinal,
            description: 'Wizard condition',
          },
        ]
      : []

    let action: Record<string, unknown> = {}

    switch (actionType) {
      case WizardActionType.REQUEST_APPROVAL:
      case WizardActionType.REQUEST_REVIEW: {
        const params: Record<string, unknown> = {
          targets,
          required: true,
          required_count: Math.max(1, requiredCount),
        }

        if (approvalLabel.trim()) params.label = approvalLabel.trim()
        if (trackedFields.length > 0) params.fields = trackedFields

        const key = actionType === WizardActionType.REQUEST_REVIEW ? 'review' : 'approval'
        action = {
          key,
          type: actionType,
          description: approvalLabel.trim(),
          params,
        }
        break
      }
      case WizardActionType.NOTIFY:
        action = {
          key: 'notify',
          type: actionType,
          description: notificationTitle.trim(),
          params: {
            targets,
            title: notificationTitle.trim(),
            body: notificationBody.trim(),
            channels: notificationChannels.length > 0 ? notificationChannels : ['IN_APP'],
          },
        }
        break
      case WizardActionType.WEBHOOK: {
        const webhookParams: Record<string, unknown> = {
          url: webhookUrl.trim(),
          method: webhookMethod,
        }
        if (webhookPayload.trim()) webhookParams.payload_expr = webhookPayload.trim()
        action = {
          key: 'webhook',
          type: actionType,
          description: `Webhook ${webhookMethod}`,
          params: webhookParams,
        }
        break
      }
      case WizardActionType.UPDATE_FIELD:
        action = {
          key: 'field_update',
          type: actionType,
          description: `Update ${fieldUpdateField}`,
          params: {
            updates: fieldUpdateField ? { [fieldUpdateField]: fieldUpdateValue } : {},
          },
        }
    }

    const finalName = name.trim() || suggestedName

    return {
      name: finalName,
      description: description.trim() || undefined,
      schemaType,
      workflowKind,
      approvalTiming: actionType === WizardActionType.REQUEST_APPROVAL ? approvalTiming : undefined,
      approvalSubmissionMode: workflowKind === WorkflowDefinitionWorkflowKind.APPROVAL ? DEFAULT_APPROVAL_SUBMISSION_MODE : undefined,
      version: DEFAULT_VERSION,
      targets: {},
      triggers: [trigger],
      conditions,
      actions: Object.keys(action).length > 0 ? [action] : [],
      metadata: {
        createdFrom: 'wizard',
      },
    }
  }

  const workflowPreview = useMemo(
    () => buildWorkflowDocument(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      actionType,
      approvalTiming,
      approvalLabel,
      conditionExpressionFinal,
      description,
      edges,
      fieldScope,
      fieldUpdateField,
      fieldUpdateValue,
      name,
      notificationBody,
      notificationChannels,
      notificationTitle,
      objectLabel,
      operation,
      operationLabel,
      parsedWebhookPayload,
      requiredCount,
      schemaType,
      suggestedName,
      targets,
      trackedFields,
      webhookMethod,
      webhookUrl,
      workflowKind,
    ],
  )

  const getValidationError = (stepId: string) => {
    if (stepId === 'flow') {
      if (!schemaType) return 'Select the object this workflow applies to.'
      if (!operationPicked) return 'Select when it should run.'
      if (!actionType) return 'Select the action this workflow should take.'
    }
    if (stepId === 'rules') {
      if (!schemaType || !operationPicked) return 'Complete the Flow step first.'
      if (operation === 'UPDATE' && fieldScope === 'specific' && trackedFields.length === 0) {
        return 'Pick at least one tracked field.'
      }
      if (conditionEnabled) {
        if (conditionUseCel && !conditionExpression.trim()) return 'Add a CEL condition or turn off conditions.'
        if (!conditionUseCel && (!conditionField || !conditionValue.trim())) return 'Select a field and value for the condition.'
      }
    }
    if (stepId === 'configure') {
      if (!actionType) return 'Select an action in the Flow step before configuring.'
      if (actionType === WizardActionType.REQUEST_APPROVAL && targets.length === 0) return 'Add at least one approver target.'
      if (actionType === WizardActionType.REQUEST_REVIEW && targets.length === 0) return 'Add at least one review target.'
      if (actionType === WizardActionType.NOTIFY && targets.length === 0) return 'Add at least one notification target.'
      if (actionType === WizardActionType.WEBHOOK) {
        if (!webhookUrl.trim()) return 'Add a webhook URL.'
        if (webhookUrl.trim() && !/^https?:\/\/.+/.test(webhookUrl.trim())) return 'Webhook URL must start with http:// or https://'
      }
      if (actionType === WizardActionType.UPDATE_FIELD && !fieldUpdateField) return 'Select the field you want to update.'
    }
    if (stepId === 'review') {
      const finalName = name.trim() || suggestedName
      if (!finalName) return 'Give your workflow a name.'
    }
    return null
  }

  return {
    // Core state
    actionType,
    setActionType,
    workflowKind,
    setWorkflowKind,
    approvalTiming,
    setApprovalTiming,
    schemaType,
    setSchemaType,
    operation,
    setOperation,
    operationPicked,
    setOperationPicked,
    fieldScope,
    setFieldScope,
    trackedFields,
    setTrackedFields,
    edges,
    setEdges,
    edgeInput,
    setEdgeInput,
    edgeSelect,
    setEdgeSelect,
    conditionEnabled,
    setConditionEnabled,
    conditionUseCel,
    setConditionUseCel,
    conditionField,
    setConditionField,
    conditionOperator,
    setConditionOperator,
    conditionValue,
    setConditionValue,
    conditionExpression,
    setConditionExpression,

    // Action config state
    targets,
    setTargets,
    approvalLabel,
    setApprovalLabel,
    requiredCount,
    setRequiredCount,
    notificationTitle,
    setNotificationTitle,
    notificationBody,
    setNotificationBody,
    notificationChannels,
    setNotificationChannels,
    webhookUrl,
    setWebhookUrl,
    webhookMethod,
    setWebhookMethod,
    webhookPayload,
    setWebhookPayload,
    fieldUpdateField,
    setFieldUpdateField,
    fieldUpdateValue,
    setFieldUpdateValue,

    // Review state
    name,
    setName,
    description,
    setDescription,
    active,
    setActive,
    draft,
    setDraft,
    isDefault,
    setIsDefault,
    cooldownSeconds,
    setCooldownSeconds,

    // Pass-through
    userOptions,
    groupOptions,

    // Derived
    selectedObject,
    objectLabel,
    selectedActionLabel,
    eligibleFields,
    resolverKeys,
    sortedObjectTypes,
    edgeOptions,
    hasEdgeOptions,
    operationLabel,
    suggestedName,
    parsedWebhookPayload,
    webhookPayloadError,
    conditionExpressionFinal,
    workflowPreview,

    // Handlers
    addTarget,
    removeTarget,
    getTargetLabel,
    handleSelectGoal,
    toggleTrackedField,
    addEdge,
    removeEdge,
    toggleChannel,

    // Validation & build
    getValidationError,
    buildWorkflowDocument,
  }
}

export type WizardState = ReturnType<typeof useWizardState>
