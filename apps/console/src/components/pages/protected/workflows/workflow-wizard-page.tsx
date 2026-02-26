'use client'

import { useEffect, useMemo, useState } from 'react'
import { defineStepper } from '@stepperize/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageHeading } from '@repo/ui/page-heading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/cardpanel'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Switch } from '@repo/ui/switch'
import { Badge } from '@repo/ui/badge'
import { Separator } from '@repo/ui/separator'
import { Checkbox } from '@repo/ui/checkbox'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useCreateWorkflowDefinition, useWorkflowDefinitionsWithFilter, WorkflowDefinitionsNodeNonNull } from '@/lib/graphql-hooks/workflow-definition'
import { useWorkflowMetadata } from '@/lib/graphql-hooks/workflows'
import { useUserSelect } from '@/lib/graphql-hooks/member'
import { useGroupSelect } from '@/lib/graphql-hooks/group'
import { getWorkflowTemplateById, TRIGGER_OPERATION_OPTIONS, WORKFLOW_TEMPLATES } from '@/lib/workflow-templates'
import { CreateWorkflowDefinitionInput, WorkflowDefinition, WorkflowDefinitionWorkflowKind } from '@repo/codegen/src/schema'
import { ArrowRight, Bell, CheckCircle, CircleCheckBig, Layers, Plus, Sparkles, Webhook, Wrench, X, Zap } from 'lucide-react'
import { toHumanLabel } from '@/utils/strings'
import { WizardActionType, ACTION_LABELS, WEBHOOK_METHOD_OPTIONS } from './types'
import { WizardStepNav } from './wizard/nav'

const { useStepper } = defineStepper(
  { id: 'flow', label: 'Flow' },
  { id: 'rules', label: 'Refine' },
  { id: 'configure', label: 'Configure' },
  { id: 'review', label: 'Review' },
)

type Target = {
  type: 'USER' | 'GROUP' | 'RESOLVER'
  id?: string
  resolver_key?: string
}

type WorkflowDocument = {
  schemaType?: string
  workflowKind?: WorkflowDefinitionWorkflowKind
  name?: string
  conditions?: any[]
  actions?: any[]
  description?: string
  approvalTiming?: ApprovalTiming
  approvalSubmissionMode?: ApprovalSubmissionMode
  triggers?: Array<Record<string, any>>
}

type ConditionOperator = 'eq' | 'neq'

type GoalOption = {
  id: string
  label: string
  description: string
  actionType: keyof typeof WizardActionType
  workflowKind: WorkflowDefinitionWorkflowKind
  icon: React.ReactElement
}

const GOAL_OPTIONS: GoalOption[] = [
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
    actionType: WizardActionType.REVIEW,
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
    actionType: WizardActionType.FIELD_UPDATE,
    workflowKind: WorkflowDefinitionWorkflowKind.LIFECYCLE,
    icon: <Wrench className="text-btn-primary" size={20} />,
  },
]


const DEFAULT_VERSION = '1.0'
const DEFAULT_APPROVAL_TIMING = 'PRE_COMMIT'
const DEFAULT_APPROVAL_SUBMISSION_MODE = 'AUTO_SUBMIT'

type ApprovalTiming = 'PRE_COMMIT' | 'POST_COMMIT'
type ApprovalSubmissionMode = 'AUTO_SUBMIT' | 'MANUAL_SUBMIT'

const parseDefinitionJSON = (value: unknown): WorkflowDocument => {
  if (!value) return {}
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as WorkflowDocument
    } catch {
      return {}
    }
  }
  return value as WorkflowDocument
}

const normalizeApprovalTiming = (value?: unknown): ApprovalTiming => {
  if (value === null || value === undefined) return DEFAULT_APPROVAL_TIMING
  const normalized = String(value).toUpperCase()
  return normalized === 'POST_COMMIT' ? 'POST_COMMIT' : 'PRE_COMMIT'
}

const isPlaceholderValue = (value?: string | null) => {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return normalized.includes('replace') || normalized.includes('<') || normalized.includes('>')
}

const buildConditionExpression = ({
  enabled,
  useCel,
  field,
  operator,
  value,
  celExpression,
}: {
  enabled: boolean
  useCel: boolean
  field: string
  operator: ConditionOperator
  value: string
  celExpression: string
}) => {
  if (!enabled) return ''
  if (useCel) return celExpression.trim()
  if (!field || !value.trim()) return ''
  const normalizedValue = JSON.stringify(value.trim())
  if (operator === 'neq') return `object.${field} != ${normalizedValue}`
  return `object.${field} == ${normalizedValue}`
}

const buildTargetKey = (target: Target) => `${target.type}:${target.id ?? target.resolver_key ?? ''}`

const formatResolverLabel = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ')

const WorkflowWizardPage = () => {
  const stepper = useStepper()
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams.get('template')
  const template = useMemo(() => (templateId ? getWorkflowTemplateById(templateId) : undefined), [templateId])
  const { successNotification, errorNotification } = useNotification()
  const createMutation = useCreateWorkflowDefinition()
  const { objectTypes, isLoading: isLoadingMetadata } = useWorkflowMetadata()
  const { data: definitions WorkflowDefinitionsNodeNonNull } = useWorkflowDefinitionsWithFilter({ enabled: !templateId })
  const { userOptions, isLoading: isLoadingUsers } = useUserSelect({})
  const { groupOptions, isLoading: isLoadingGroups } = useGroupSelect()

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
  const [templateLoaded, setTemplateLoaded] = useState(false)

  useEffect(() => {
    if (fieldScope === 'any') {
      setTrackedFields([])
    }
  }, [fieldScope])

  useEffect(() => {
    setEdgeSelect('')
  }, [schemaType])

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
  }, [schemaType, templateId, templateLoaded, templateSchemaType])

  useEffect(() => {
    setTemplateLoaded(false)
  }, [templateId])

  useEffect(() => {
    if (!template || templateLoaded) return

    const document = parseDefinitionJSON(template.definitionJSON)
    const trigger = Array.isArray(document?.triggers) && document.triggers.length > 0 ? document.triggers[0] : {}
    const conditions = Array.isArray(document?.conditions) ? document.conditions : []
    const action = Array.isArray(document?.actions) && document.actions.length > 0 ? document.actions[0] : undefined

    const schema = (document?.schemaType as string) || template.schemaType || ''
    const normalizedOperation = ((trigger?.operation as string) || 'UPDATE').toUpperCase()

    setSchemaType(schema)
    setOperation(normalizedOperation as 'CREATE' | 'UPDATE' | 'DELETE')
    setOperationPicked(true)

    const triggerFields = Array.isArray(trigger?.fields) ? trigger.fields.filter(Boolean) : []
    setFieldScope(triggerFields.length > 0 ? 'specific' : 'any')
    setTrackedFields(triggerFields)
    setEdges(Array.isArray(trigger?.edges) ? trigger.edges.filter(Boolean) : [])

    if (conditions.length > 0 && conditions[0]?.expression) {
      setConditionEnabled(true)
      setConditionUseCel(true)
      setConditionExpression(conditions[0].expression)
    } else {
      setConditionEnabled(false)
      setConditionExpression('')
    }

    const resolvedKind =
      (document?.workflowKind as WorkflowDefinitionWorkflowKind) || (template.definitionJSON?.workflowKind as WorkflowDefinitionWorkflowKind) || WorkflowDefinitionWorkflowKind.APPROVAL
    setWorkflowKind(resolvedKind)
    setApprovalTiming(normalizeApprovalTiming(document?.approvalTiming))

    setName(document?.name ?? template.name ?? '')
    setDescription(document?.description ?? template.description ?? '')

    const actionTypeRaw = (action?.type as string) || ''
    const actionTypeNormalized = actionTypeRaw === 'APPROVAL' ? WizardActionType.REQUEST_APPROVAL : actionTypeRaw
    let shouldJumpToConfigure = false

    setActionType(actionTypeNormalized as WizardActionType)

    switch (actionTypeNormalized) {
      case WizardActionType.REQUEST_APPROVAL, WizardActionType.REVIEW:
        const rawTargets = Array.isArray(action?.params?.targets) ? action.params.targets : []
        const sanitizedTargets = rawTargets.filter((target: Target) => {
          if (target.type === 'RESOLVER') {
            return !isPlaceholderValue(target.resolver_key)
          }
          return !isPlaceholderValue(target.id)
        })
        setTargets(sanitizedTargets)
        setApprovalLabel(action?.params?.label ?? '')
        setRequiredCount(action?.params?.required_count ?? 1)
        shouldJumpToConfigure = sanitizedTargets.length === 0
        break
      case WizardActionType.NOTIFY:
        setTargets(sanitizedTargets)
        setNotificationTitle(action?.params?.title ?? '')
        setNotificationBody(action?.params?.body ?? '')
        setNotificationChannels(action?.params?.channels ?? ['IN_APP'])
        shouldJumpToConfigure = sanitizedTargets.length === 0

        break
      case WizardActionType.WEBHOOK:
        const urlValue = action?.params?.url ?? ''
        setWebhookUrl(isPlaceholderValue(urlValue) ? '' : urlValue)
        setWebhookMethod(action?.params?.method ?? 'POST')
        setWebhookPayload(action?.params?.payload ? JSON.stringify(action.params.payload, null, 2) : '')
        shouldJumpToConfigure = isPlaceholderValue(urlValue) || !urlValue
        break
      case WizardActionType.FIELD_UPDATE:
        const updates = action?.params?.updates ?? {}
        const [field, value] = Object.entries(updates)[0] ?? []
        if (field) setFieldUpdateField(field)
        if (value !== undefined) {
          setFieldUpdateValue(typeof value === 'string' ? value : JSON.stringify(value))
        }
    }

    setTemplateLoaded(true)
    requestAnimationFrame(() => stepper.goTo(shouldJumpToConfigure ? 'configure' : 'review'))
  }, [template, templateLoaded, stepper])

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

  const eligibleFields = selectedObject?.eligibleFields ?? []
  const resolverKeys = selectedObject?.resolverKeys ?? []

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
        const objectType = trigger.objectType || fallbackSchemaType
        if (schemaType && objectType && objectType !== schemaType) return
        const triggerEdges = Array.isArray(trigger.edges) ? trigger.edges : []
        triggerEdges.forEach((edge: string) => {
          if (edge) edgesSet.add(edge)
        })
      })
    }

    if (definitions?.workflowDefinitions?.edges) {
      definitions.workflowDefinitions.edges.forEach((definition: WorkflowDefinitionsNodeNonNull) => {
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
  }, [definitions, edges, objectTypes, schemaType])

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
    if (target.resolver_key) return resolverLabels.get(target.resolver_key) ?? formatResolverLabel(target.resolver_key)
    return 'Resolver'
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
    const trigger: Record<string, any> = {
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

    let action: Record<string, any> = {}

    switch (actionType) {

      case WizardActionType.REQUEST_APPROVAL, WizardActionType.REVIEW:
        const params: Record<string, any> = {
          targets,
          required: true,
          required_count: Math.max(1, requiredCount),
        }

        if (approvalLabel.trim()) params.label = approvalLabel.trim()
        if (trackedFields.length > 0) params.fields = trackedFields

        const key = actionType == WizardActionType.REVIEW ? 'review' : 'approval'
        console.log('Building action with actionType', actionType, 'and params', params)
        action = {
          key: key,
          type: actionType,
          description: approvalLabel.trim(),
          params,
        }
        break
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
      case WizardActionType.WEBHOOK:
        action = {
          key: 'webhook',
          type: actionType,
          description: `Webhook ${webhookMethod}`,
          params: {
            url: webhookUrl.trim(),
            method: webhookMethod,
            headers: { 'Content-Type': 'application/json' },
            payload: parsedWebhookPayload || {},
            timeout_ms: 5000,
          },
        }
        break
      case WizardActionType.FIELD_UPDATE:
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
      approvalSubmissionMode:
        workflowKind === WorkflowDefinitionWorkflowKind.APPROVAL ? DEFAULT_APPROVAL_SUBMISSION_MODE : undefined,
      version: DEFAULT_VERSION,
      targets: {},
      triggers: [trigger],
      conditions,
      actions: actionType ? [action] : [],
      metadata: {
        createdFrom: 'wizard',
      },
    }
  }

  const workflowPreview = useMemo(() => buildWorkflowDocument(), [
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
  ])

  const getValidationError = (stepId: string) => {
    if (stepId === 'flow') {
      if (!schemaType) return 'Select the object this workflow applies to.'
      if (!operationPicked) return 'Select when it should run.'
      if (!actionType) return 'Select the action this workflow should take.'
    }
    if (stepId === 'rules') {
      if (!schemaType || !operationPicked) return 'Complete the Flow step first.'
      if (operation === 'UPDATE' && fieldScope === 'specific' && trackedFields.length === 0) {
        return 'Pick at least one tracked field, or choose “Any field change”.'
      }
      if (conditionEnabled) {
        if (conditionUseCel && !conditionExpression.trim()) return 'Add a CEL condition or turn off conditions.'
        if (!conditionUseCel && (!conditionField || !conditionValue.trim())) return 'Select a field and value for the condition.'
      }
    }
    if (stepId === 'configure') {
      if (!actionType) return 'Select an action in the Flow step before configuring.'
      if (actionType === WizardActionType.REQUEST_APPROVAL && targets.length === 0) return 'Add at least one approver target.'
      if (actionType === WizardActionType.REVIEW && targets.length === 0) return 'Add at least one review target.'
      if (actionType === WizardActionType.NOTIFY && targets.length === 0) return 'Add at least one notification target.'
      if (actionType === WizardActionType.WEBHOOK) {
        if (!webhookUrl.trim()) return 'Add a webhook URL.'
        if (webhookPayloadError) return webhookPayloadError
      }
      if (actionType === WizardActionType.FIELD_UPDATE && !fieldUpdateField) return 'Select the field you want to update.'
    }
    if (stepId === 'review') {
      const finalName = name.trim() || suggestedName
      if (!finalName) return 'Give your workflow a name.'
    }
    return null
  }

  const currentStepError = getValidationError(stepper.current.id)
  const canContinue = !currentStepError
  const actionStepError = stepper.current.id === 'configure' ? currentStepError : null

  const handleBack = () => {
    if (stepper.isFirst) {
      router.push('/workflows')
      return
    }
    stepper.prev()
  }

  const handleNext = async () => {
    const error = getValidationError(stepper.current.id)
    if (error) {
      errorNotification({ title: 'Missing details', description: error })
      return
    }

    if (!stepper.isLast) {
      stepper.next()
      return
    }

    const finalName = name.trim() || suggestedName
    const workflowDocument = buildWorkflowDocument()

    if (!finalName) {
      errorNotification({ title: 'Workflow name is required' })
      return
    }

    if (!schemaType || !actionType) {
      errorNotification({ title: 'Missing workflow details' })
      return
    }

    const input: CreateWorkflowDefinitionInput = {
      name: finalName,
      description: description.trim() || undefined,
      schemaType,
      workflowKind,
      active,
      draft,
      isDefault,
      cooldownSeconds,
      definitionJSON: workflowDocument,
    }

    try {
      const response = await createMutation.mutateAsync(input)
      const id = response?.createWorkflowDefinition?.workflowDefinition?.id

      successNotification({
        title: 'Workflow created',
        description: 'Your workflow has been saved. You can continue editing in the advanced editor.',
      })

      if (id) {
        router.push(`/workflows/editor?id=${id}`)
        return
      }

      router.push('/workflows')
    } catch (error) {
      errorNotification({
        title: 'Unable to save workflow',
        description: parseErrorMessage(error),
      })
    }
  }

  return (
    <div className="max-w-8xl mx-auto px-6 py-2">
      <p className="text-muted-foreground">Build a workflow in a few guided steps. Pick the object, trigger, and action, then configure the details.</p>
      <div className="py-6">
        {stepper.switch({
          flow: () => (
            <Card>
              <CardContent>
                <div className="space-y-6 flex justify-center w-full">
                  <WizardStepNav
                    stepper={stepper}
                    enabledMap={{
                      flow: true,
                      rules: Boolean(schemaType && operationPicked),
                      configure: Boolean(schemaType && operationPicked && actionType),
                      review: Boolean(schemaType && operationPicked && actionType),
                    }}
                  />
                </div>
                <Separator className="mt-2 mb-4" />

                {isLoadingMetadata ? (
                  <p className="text-sm text-muted-foreground">Loading workflow metadata...</p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_auto_1fr] gap-2 items-stretch">
                      <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 flex h-full min-h-[84px] items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-md border bg-background">
                          <Layers className="h-4 w-4 text-sky-600" />
                        </span>
                        <div>
                          <p className="text-sm font-medium">What object should this apply to?</p>
                          <p className="text-xs text-muted-foreground">Pick the object type the workflow will operate on</p>
                        </div>
                      </div>
                      <div className="hidden lg:flex items-center justify-center text-muted-foreground self-center">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                      <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 flex h-full min-h-[84px] items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-md border bg-background">
                          <Zap className="h-4 w-4 text-emerald-600" />
                        </span>
                        <div>
                          <p className="text-sm font-medium">What triggers it to run?</p>
                          <p className="text-xs text-muted-foreground">Choose a create, update, or delete event.</p>
                        </div>
                      </div>
                      <div className="hidden lg:flex items-center justify-center text-muted-foreground self-center">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                      <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 flex h-full min-h-[84px] items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-md border bg-background">
                          <Wrench className="h-4 w-4 text-amber-600" />
                        </span>
                        <div>
                          <p className="text-sm font-medium">What action should be taken?</p>
                          <p className="text-xs text-muted-foreground">Route approvals, notify, or call a webhook.</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="rounded-lg border border-border/60 p-3 bg-muted/10">
                        <div className="space-y-2">
                          {sortedObjectTypes.map((obj) => {
                            const selected = schemaType === obj.type
                            return (
                              <button
                                key={obj.type}
                                type="button"
                                onClick={() => {
                                  if (schemaType === obj.type) {
                                    setSchemaType('')
                                    setOperationPicked(false)
                                    setActionType(null)
                                    return
                                  }
                                  setSchemaType(obj.type)
                                }}
                                className={`w-full text-left rounded-md border px-3 py-2 transition ${selected ? 'border-primary bg-muted/20' : 'border-border hover:border-primary/60'}`}
                              >
                                <p className="text-sm font-medium">{toHumanLabel(obj.label) || toHumanLabel(obj.type)}</p>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className={`rounded-lg border border-border/60 p-3 transition bg-muted/10 ${schemaType ? '' : 'opacity-60'}`}>
                        <div className="space-y-2">
                          {TRIGGER_OPERATION_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                if (!schemaType) return
                                if (operationPicked && operation === opt.value) {
                                  setOperationPicked(false)
                                  return
                                }
                                setOperation(opt.value as 'CREATE' | 'UPDATE' | 'DELETE')
                                setOperationPicked(true)
                              }}
                              disabled={!schemaType}
                              className={`w-full text-left rounded-md border px-3 py-2 transition ${operationPicked && operation === opt.value ? 'border-primary bg-muted/20' : 'border-border hover:border-primary/60'
                                } ${!schemaType ? 'cursor-not-allowed' : ''}`}
                            >
                              <p className="text-sm font-medium">{opt.label}</p>
                              <p className="text-xs text-muted-foreground">
                                {opt.value === 'CREATE' && 'Runs when a new record is created.'}
                                {opt.value === 'UPDATE' && 'Runs when tracked fields or edges change.'}
                                {opt.value === 'DELETE' && 'Runs when a record is removed.'}
                              </p>
                            </button>
                          ))}
                        </div>
                        {!schemaType && <div className="mt-3" />}
                      </div>

                      <div className={`rounded-lg border border-border/60 p-3 transition bg-muted/10 ${schemaType && operationPicked ? '' : 'opacity-60'}`}>
                        <div className="space-y-2">
                          {GOAL_OPTIONS.map((option) => {
                            const selected = actionType === option.actionType
                            return (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => {
                                  if (!schemaType || !operationPicked) return
                                  if (actionType === option.actionType) {
                                    setActionType(null)
                                    return
                                  }
                                  handleSelectGoal(option)
                                }}
                                disabled={!schemaType || !operationPicked}
                                className={`w-full text-left rounded-md border px-3 py-2 transition ${schemaType && operationPicked && selected ? 'border-primary bg-muted/20' : 'border-border hover:border-primary/60'
                                  } ${!schemaType || !operationPicked ? 'cursor-not-allowed' : ''}`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="flex h-7 w-7 items-center justify-center rounded-md border bg-secondary">{option.icon}</span>
                                  <div>
                                    <p className="text-sm font-medium">{option.label}</p>
                                    <p className="text-xs text-muted-foreground">{option.description}</p>
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                        {!schemaType && <div className="mt-3" />}
                        {schemaType && !operationPicked && <div className="mt-3" />}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ),
          rules: () => (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Refine the trigger</CardTitle>
                  <CardDescription>Fine-tune fields, edges, and optional conditions for the selected flow.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FlowSummary
                    objectLabel={toHumanLabel(objectLabel)}
                    operationLabel={operationLabel || '—'}
                    actionLabel={actionType ? ACTION_LABELS[actionType] : '—'}
                  />

                  {operation === 'UPDATE' ? (
                    <div className="space-y-4 rounded-lg border border-border/60 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <Label>Tracked fields</Label>
                          <p className="text-xs text-muted-foreground">Select which field changes should trigger this workflow.</p>
                        </div>
                        <div className="flex items-center gap-3 rounded-full border border-border/60 bg-muted/10 px-3 py-2">
                          <span className={`text-xs ${fieldScope === 'any' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>Any field</span>
                          <Switch checked={fieldScope === 'specific'} onCheckedChange={(checked) => setFieldScope(checked ? 'specific' : 'any')} />
                          <span className={`text-xs ${fieldScope === 'specific' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>Specific fields</span>
                        </div>
                      </div>
                      {fieldScope === 'any' ? (
                        <div className="rounded-md border border-border/60 bg-muted/10 px-3 py-3 text-sm text-muted-foreground">
                          Any update on {toHumanLabel(objectLabel)} will trigger this workflow.
                        </div>
                      ) : eligibleFields.length === 0 ? (
                        <div className="rounded-md border border-border/60 bg-muted/10 px-3 py-3 text-sm text-muted-foreground">
                          No eligible fields are available for this object.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {eligibleFields.map((field) => {
                            const checked = trackedFields.includes(field.name)
                            return (
                              <label
                                key={field.name}
                                className={`flex items-start gap-3 rounded-md border px-3 py-2 transition ${checked ? 'border-primary bg-primary/5' : 'border-border/60 bg-background hover:border-primary/60'
                                  }`}
                              >
                                <Checkbox checked={checked} onCheckedChange={(value) => toggleTrackedField(field.name, Boolean(value))} />
                                <div>
                                  <p className="text-sm font-medium">{field.label || field.name}</p>
                                  {field.label && field.label !== field.name && <p className="text-xs text-muted-foreground">{field.name}</p>}
                                </div>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground">
                      Tracked fields apply to update triggers. Your workflow runs on <span className="font-medium text-foreground">{operationLabel || operation}</span>.
                    </div>
                  )}

                  <div className="space-y-3 rounded-lg border border-border/60 p-4">
                    <div>
                      <Label>Edge changes (optional)</Label>
                      <p className="text-xs text-muted-foreground">Trigger when relationships like evidence or owners change.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {hasEdgeOptions ? (
                        <Select value={edgeSelect} onValueChange={setEdgeSelect}>
                          <SelectTrigger className="flex-1 min-w-[220px]">
                            <SelectValue placeholder="Select an edge" />
                          </SelectTrigger>
                          <SelectContent>
                            {edgeOptions.map((edge) => (
                              <SelectItem key={edge} value={edge}>
                                {edge}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={edgeInput} onChange={(e) => setEdgeInput(e.target.value)} placeholder="e.g., evidence, owner" className="flex-1 min-w-[200px]" />
                      )}
                      <Button type="button" variant="outline" onClick={addEdge} disabled={hasEdgeOptions ? !edgeSelect : !edgeInput.trim()}>
                        Add edge
                      </Button>
                    </div>
                    {!hasEdgeOptions && (
                      <p className="text-xs text-muted-foreground">No edge suggestions yet. Add one manually.</p>
                    )}
                    {edges.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {edges.map((edge) => (
                          <Badge key={edge} variant="secondary" className="flex items-center gap-1">
                            {edge}
                            <button type="button" onClick={() => removeEdge(edge)} className="text-muted-foreground hover:text-foreground">
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 rounded-lg border border-border/60 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Condition (optional)</Label>
                        <p className="text-xs text-muted-foreground">Only run when this expression matches.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={conditionEnabled} onCheckedChange={setConditionEnabled} />
                        <span className="text-sm text-muted-foreground">Only when</span>
                      </div>
                    </div>

                    {conditionEnabled && !conditionUseCel && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Select value={conditionField} onValueChange={setConditionField}>
                          <SelectTrigger>
                            <SelectValue placeholder="Field" />
                          </SelectTrigger>
                          <SelectContent>
                            {eligibleFields.map((field) => (
                              <SelectItem key={field.name} value={field.name}>
                                {field.label || field.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select value={conditionOperator} onValueChange={(val) => setConditionOperator(val as ConditionOperator)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Operator" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="eq">is</SelectItem>
                            <SelectItem value="neq">is not</SelectItem>
                          </SelectContent>
                        </Select>

                        <Input value={conditionValue} onChange={(e) => setConditionValue(e.target.value)} placeholder="Value" />
                      </div>
                    )}

                    {conditionEnabled && conditionUseCel && (
                      <Textarea
                        value={conditionExpression}
                        onChange={(e) => setConditionExpression(e.target.value)}
                        rows={3}
                        placeholder="e.g. object.status == 'PUBLISHED'"
                      />
                    )}

                    {conditionEnabled && (
                      <Button type="button" variant="transparent" onClick={() => setConditionUseCel((prev) => !prev)}>
                        {conditionUseCel ? 'Use simple builder' : 'Use CEL expression'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ),
          configure: () => (
            <Card>
              <CardHeader>
                <CardTitle>{selectedActionLabel ? `Configure ${selectedActionLabel.toLowerCase()}` : 'Configure the action'}</CardTitle>
                <CardDescription>Choose recipients and fill out the action details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FlowSummary
                  objectLabel={toHumanLabel(objectLabel)}
                  operationLabel={operationLabel || '—'}
                  actionLabel={selectedActionLabel || '—'}
                />

                {(actionType === 'REQUEST_APPROVAL' || actionType === 'REVIEW') && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>
                        {actionType === 'REVIEW' ? 'Reviewers' : 'Approvers'} <span className="text-destructive">*</span>
                      </Label>
                      <TargetSelector
                        targets={targets}
                        onAdd={addTarget}
                        onRemove={removeTarget}
                        resolverKeys={resolverKeys}
                        userOptions={userOptions}
                        groupOptions={groupOptions}
                        getTargetLabel={getTargetLabel}
                        isLoading={isLoadingUsers || isLoadingGroups}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{actionType === 'REVIEW' ? 'Review label' : 'Approval label'}</Label>
                        <Input
                          value={approvalLabel}
                          onChange={(e) => setApprovalLabel(e.target.value)}
                          placeholder={actionType === 'REVIEW' ? 'e.g. Control change review' : 'e.g. Control change approval'}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{actionType === 'REVIEW' ? 'Required reviews' : 'Required approvals'}</Label>
                        <Input
                          type="number"
                          min="1"
                          value={requiredCount}
                          onChange={(e) => setRequiredCount(Number(e.target.value) || 1)}
                        />
                      </div>
                    </div>
                    {actionType === 'REQUEST_APPROVAL' && (
                      <div className="space-y-2">
                        <Label>Approval timing</Label>
                        <Select value={approvalTiming} onValueChange={(val) => setApprovalTiming(val as ApprovalTiming)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PRE_COMMIT">Pre-commit (blocks change until approved)</SelectItem>
                            <SelectItem value="POST_COMMIT">Post-commit (approval occurs after change)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Pre-commit approvals gate the change. Post-commit approvals review after changes apply.</p>
                      </div>
                    )}
                    {actionType === 'REQUEST_APPROVAL' && trackedFields.length > 0 && (
                      <div className="text-sm text-muted-foreground">Fields gated by approval: {trackedFields.join(', ')}</div>
                    )}
                  </div>
                )}

                {actionType === 'NOTIFY' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>
                        Recipients <span className="text-destructive">*</span>
                      </Label>
                      <TargetSelector
                        targets={targets}
                        onAdd={addTarget}
                        onRemove={removeTarget}
                        resolverKeys={resolverKeys}
                        userOptions={userOptions}
                        groupOptions={groupOptions}
                        getTargetLabel={getTargetLabel}
                        isLoading={isLoadingUsers || isLoadingGroups}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input value={notificationTitle} onChange={(e) => setNotificationTitle(e.target.value)} placeholder="Notification title" />
                    </div>
                    <div className="space-y-2">
                      <Label>Message</Label>
                      <Textarea value={notificationBody} onChange={(e) => setNotificationBody(e.target.value)} rows={3} placeholder="Describe the notification" />
                    </div>
                    <div className="space-y-2">
                      <Label>Channels</Label>
                      <div className="flex flex-wrap gap-3">
                        {['IN_APP', 'EMAIL', 'SLACK'].map((channel) => (
                          <label key={channel} className="flex items-center gap-2 text-sm">
                            <Checkbox checked={notificationChannels.includes(channel)} onCheckedChange={(checked) => toggleChannel(channel, Boolean(checked))} />
                            <span>{channel.replace('_', ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {actionType === 'WEBHOOK' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>
                          Webhook URL <span className="text-destructive">*</span>
                        </Label>
                        <Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://" />
                      </div>
                      <div className="space-y-2">
                        <Label>Method</Label>
                        <Select value={webhookMethod} onValueChange={setWebhookMethod}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            {WEBHOOK_METHOD_OPTIONS.map((method) => (
                              <SelectItem key={method} value={method}>
                                {method}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Payload (JSON)</Label>
                      <Textarea
                        value={webhookPayload}
                        onChange={(e) => setWebhookPayload(e.target.value)}
                        rows={4}
                        placeholder='{"event":"workflow"}'
                      />
                      {webhookPayloadError && <p className="text-sm text-destructive">{webhookPayloadError}</p>}
                    </div>
                  </div>
                )}

                {actionType === 'FIELD_UPDATE' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>
                        Field <span className="text-destructive">*</span>
                      </Label>
                      {eligibleFields.length > 0 ? (
                        <Select value={fieldUpdateField} onValueChange={setFieldUpdateField}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a field" />
                          </SelectTrigger>
                          <SelectContent>
                            {eligibleFields.map((field) => (
                              <SelectItem key={field.name} value={field.name}>
                                {field.label || field.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={fieldUpdateField} onChange={(e) => setFieldUpdateField(e.target.value)} placeholder="Field name" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Value</Label>
                      <Input value={fieldUpdateValue} onChange={(e) => setFieldUpdateValue(e.target.value)} placeholder="New value" />
                    </div>
                  </div>
                )}

                {!actionType && <p className="text-sm text-muted-foreground">Choose a goal to configure the action.</p>}
                {actionStepError && <p className="text-sm text-destructive">{actionStepError}</p>}
              </CardContent>
            </Card>
          ),
          review: () => (
            <div className="space-y-2">
              <Card>
                <CardHeader>
                  <CardTitle>Review & create</CardTitle>
                  <CardDescription>Give the workflow a name and confirm the details.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={suggestedName || 'Workflow name'} />
                        {!name && suggestedName && <p className="text-xs text-muted-foreground">Suggested: {suggestedName}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe what this workflow does" />
                      </div>

                      <div className="rounded-lg border border-border p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Active</span>
                          <Switch checked={active} onCheckedChange={setActive} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Draft</span>
                          <Switch checked={draft} onCheckedChange={setDraft} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Default for schema</span>
                          <Switch checked={isDefault} onCheckedChange={setIsDefault} />
                        </div>
                        <div className="space-y-2">
                          <Label>Cooldown (seconds)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={cooldownSeconds}
                            onChange={(e) => setCooldownSeconds(Number(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-lg border border-border p-4 space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Goal</p>
                          <p className="font-medium">{actionType ? ACTION_LABELS[actionType] : '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Object</p>
                          <p className="font-medium">{toHumanLabel(objectLabel) || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Trigger</p>
                          <p className="font-medium">
                            {(operationLabel || operation) || '—'} {fieldScope === 'specific' && trackedFields.length > 0 ? `(${trackedFields.join(', ')})` : ''}
                          </p>
                          {edges.length > 0 && <p className="text-sm text-muted-foreground">Edges: {edges.join(', ')}</p>}
                        </div>
                        {conditionExpressionFinal && (
                          <div>
                            <p className="text-xs text-muted-foreground">Condition</p>
                            <p className="text-sm">{conditionExpressionFinal}</p>
                          </div>
                        )}
                        {targets.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground">Targets</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {targets.map((target) => (
                                <Badge key={buildTargetKey(target)} variant="secondary">
                                  {getTargetLabel(target)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Definition preview</Label>
                        <Textarea readOnly value={JSON.stringify(workflowPreview, null, 2)} className="font-mono text-xs" rows={12} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ),
        })}

        <div className="flex items-center justify-between mt-8">
          <Button type="button" variant="secondary" onClick={handleBack}>
            Back
          </Button>
          <Button type="button" variant="primary" onClick={handleNext} disabled={!canContinue || createMutation.isPending} loading={createMutation.isPending}>
            {stepper.isLast ? 'Create workflow' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  )
}

type TargetSelectorProps = {
  targets: Target[]
  onAdd: (target: Target) => void
  onRemove: (target: Target) => void
  resolverKeys: string[]
  userOptions: { label: string; value: string }[]
  groupOptions: { label: string; value: string }[]
  getTargetLabel: (target: Target) => string
  isLoading?: boolean
}

type FlowSummaryProps = {
  objectLabel?: string
  operationLabel?: string
  actionLabel?: string
}



const FlowSummary = ({ objectLabel, operationLabel, actionLabel }: FlowSummaryProps) => (
  <div className="rounded-lg border border-border/60 bg-muted/10 p-3">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
      <div>
        <p className="text-xs text-muted-foreground">Object</p>
        <p className="font-medium">{toHumanLabel(objectLabel || '—')}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Trigger</p>
        <p className="font-medium">{operationLabel || '—'}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Action</p>
        <p className="font-medium">{actionLabel || '—'}</p>
      </div>
    </div>
  </div>
)

const TargetSelector = ({ targets, onAdd, onRemove, resolverKeys, userOptions, groupOptions, getTargetLabel, isLoading = false }: TargetSelectorProps) => {
  const [targetType, setTargetType] = useState<Target['type']>('USER')
  const [targetValue, setTargetValue] = useState('')

  const options = useMemo(() => {
    if (targetType === 'USER') return userOptions
    if (targetType === 'GROUP') return groupOptions
    return resolverKeys.map((key) => ({ label: formatResolverLabel(key), value: key }))
  }, [groupOptions, resolverKeys, targetType, userOptions])

  const showManualInput = options.length === 0
  const manualPlaceholder =
    targetType === 'USER' ? 'Paste a user ID' : targetType === 'GROUP' ? 'Paste a group ID' : 'Enter resolver key'

  const handleTargetTypeChange = (value: string) => {
    setTargetType(value as Target['type'])
    setTargetValue('')
  }

  const handleAdd = () => {
    if (!targetValue) return
    if (targetType === 'RESOLVER') {
      onAdd({ type: 'RESOLVER', resolver_key: targetValue })
    } else {
      onAdd({ type: targetType, id: targetValue })
    }
    setTargetValue('')
  }

  const handleSelectTarget = (value: string) => {
    setTargetValue(value)
    if (!value) return
    if (targetType === 'RESOLVER') {
      onAdd({ type: 'RESOLVER', resolver_key: value })
    } else {
      onAdd({ type: targetType, id: value })
    }
    setTargetValue('')
  }

  const resolverQuickAdd = resolverKeys
  const recipientBadgeClasses = [
    'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
    'border-sky-500/30 bg-sky-500/10 text-sky-700',
    'border-amber-500/30 bg-amber-500/10 text-amber-700',
    'border-rose-500/30 bg-rose-500/10 text-rose-700',
    'border-violet-500/30 bg-violet-500/10 text-violet-700',
    'border-teal-500/30 bg-teal-500/10 text-teal-700',
    'border-orange-500/30 bg-orange-500/10 text-orange-700',
    'border-lime-500/30 bg-lime-500/10 text-lime-700',
    'border-cyan-500/30 bg-cyan-500/10 text-cyan-700',
    'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-700',
  ]

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border/60 bg-muted/10 p-4">
        <div className="mb-3">
          <p className="text-sm font-medium">Add a recipient</p>
          <p className="text-xs text-muted-foreground">Select a target type, then pick a recipient to add it.</p>
        </div>

        {resolverQuickAdd.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground">Suggested resolvers</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {resolverQuickAdd.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onAdd({ type: 'RESOLVER', resolver_key: key })}
                  className="rounded-full border border-border/60 bg-background px-3 py-1 text-xs text-foreground hover:border-primary/60"
                >
                  {formatResolverLabel(key)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(220px,1fr)_auto] gap-3 items-end">
          <Select value={targetType} onValueChange={handleTargetTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Target type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="GROUP">Group</SelectItem>
              <SelectItem value="RESOLVER">Resolver</SelectItem>
            </SelectContent>
          </Select>

          {showManualInput ? (
            <Input value={targetValue} onChange={(e) => setTargetValue(e.target.value)} placeholder={manualPlaceholder} />
          ) : (
            <Select value={targetValue} onValueChange={handleSelectTarget}>
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? 'Loading...' : 'Select target'} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button type="button" variant="primary" onClick={handleAdd} disabled={!targetValue} className="whitespace-nowrap">
            <Plus className="h-4 w-4 mr-1" />
            Add recipient
          </Button>
        </div>

        {showManualInput && (
          <p className="mt-2 text-xs text-muted-foreground">
            No {targetType === 'USER' ? 'users' : targetType === 'GROUP' ? 'groups' : 'resolvers'} found. Paste an ID or switch the target type.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Selected recipients</Label>
          <span className="text-xs text-muted-foreground">{targets.length} added</span>
        </div>
        {targets.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {targets.map((target, index) => (
              <Badge
                key={buildTargetKey(target)}
                variant="outline"
                className={`flex items-center gap-1 px-2.5 py-1 text-sm ${recipientBadgeClasses[index % recipientBadgeClasses.length]}`}
              >
                {getTargetLabel(target)}
                <button type="button" onClick={() => onRemove(target)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No recipients yet. Add one above to continue.</p>
        )}
      </div>
    </div>
  )
}

export default WorkflowWizardPage
