'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/cardpanel'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { Button } from '@repo/ui/button'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Switch } from '@repo/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { WorkflowVisualEditor } from '@/components/workflows/workflow-visual-editor'
import { WorkflowFormEditor } from '@/components/workflows/workflow-form-editor'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useWorkflowMetadata } from '@/lib/graphql-hooks/workflows'
import { useWorkflowDefinition, useCreateWorkflowDefinition, useUpdateWorkflowDefinition } from '@/lib/graphql-hooks/workflow-definition'
import { getWorkflowTemplateById } from '@/lib/workflow-templates'
import type { CreateWorkflowDefinitionInput, UpdateWorkflowDefinitionInput } from '@repo/codegen/src/schema'
import { WorkflowDefinitionWorkflowKind } from '@repo/codegen/src/schema'

const DEFAULT_VERSION = '1.0'
const DEFAULT_APPROVAL_TIMING = 'PRE_COMMIT'
const DEFAULT_APPROVAL_SUBMISSION_MODE = 'AUTO_SUBMIT'

type ApprovalTiming = 'PRE_COMMIT' | 'POST_COMMIT'
type ApprovalSubmissionMode = 'AUTO_SUBMIT' | 'MANUAL_SUBMIT'

type WorkflowDocument = {
  name?: string
  description?: string
  schemaType?: string
  workflowKind?: string
  approvalTiming?: ApprovalTiming
  approvalSubmissionMode?: ApprovalSubmissionMode
  version?: string
  targets?: Record<string, unknown>
  triggers?: Record<string, unknown>[]
  conditions?: Record<string, unknown>[]
  actions?: Record<string, unknown>[]
  metadata?: Record<string, unknown>
}

const normalizeApprovalTiming = (value?: unknown): ApprovalTiming => {
  if (value === null || value === undefined) return DEFAULT_APPROVAL_TIMING
  const normalized = String(value).toUpperCase()
  return normalized === 'POST_COMMIT' ? 'POST_COMMIT' : 'PRE_COMMIT'
}

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

const sanitizeActions = (actions: Record<string, unknown>[]) =>
  actions.map((action) => {
    if (!action) return action
    const params = { ...((action.params as Record<string, unknown>) || {}) }
    if (action.type === 'REQUEST_APPROVAL' || action.type === 'REQUEST_REVIEW') {
      if (!Array.isArray(params.targets)) {
        params.targets = []
      }
      delete params.assignees
    }
    return { ...action, params }
  })

export default function WorkflowEditor() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const workflowId = searchParams.get('id')
  const templateId = searchParams.get('template')

  const template = useMemo(() => (templateId ? getWorkflowTemplateById(templateId) : undefined), [templateId])

  const { objectTypes, isLoading: isLoadingMetadata } = useWorkflowMetadata()
  const { data: definition, isLoading: isLoadingDefinition } = useWorkflowDefinition(workflowId ?? '')
  const createMutation = useCreateWorkflowDefinition()
  const updateMutation = useUpdateWorkflowDefinition()
  const { successNotification, errorNotification } = useNotification()

  const [initialized, setInitialized] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [schemaType, setSchemaType] = useState('')
  const [workflowKind, setWorkflowKind] = useState<WorkflowDefinitionWorkflowKind>(WorkflowDefinitionWorkflowKind.APPROVAL)
  const [approvalTiming, setApprovalTiming] = useState<ApprovalTiming>(DEFAULT_APPROVAL_TIMING)
  const [active, setActive] = useState(true)
  const [draft, setDraft] = useState(true)
  const [isDefault, setIsDefault] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const [triggers, setTriggers] = useState<Record<string, unknown>[]>([])
  const [conditions, setConditions] = useState<Record<string, unknown>[]>([])
  const [actions, setActions] = useState<Record<string, unknown>[]>([])
  const [editorMode, setEditorMode] = useState<'visual' | 'form'>(templateId ? 'form' : 'visual')

  useEffect(() => {
    if (!objectTypes.length || schemaType) return
    setSchemaType(objectTypes[0].type)
  }, [objectTypes, schemaType])

  useEffect(() => {
    if (!definition || initialized) return

    const document = parseDefinitionJSON(definition?.workflowDefinition?.definitionJSON)

    setName(definition.workflowDefinition?.name ?? document.name ?? '')
    setDescription(definition.workflowDefinition?.description ?? document.description ?? '')
    setSchemaType(definition.workflowDefinition?.schemaType ?? document.schemaType ?? '')
    setWorkflowKind((definition.workflowDefinition?.workflowKind ?? document.workflowKind ?? WorkflowDefinitionWorkflowKind.APPROVAL) as WorkflowDefinitionWorkflowKind)
    setApprovalTiming(normalizeApprovalTiming(document?.approvalTiming))
    setActive(definition.workflowDefinition?.active ?? true)
    setDraft(definition.workflowDefinition?.draft ?? false)
    setIsDefault(definition.workflowDefinition?.isDefault ?? false)
    setCooldownSeconds(definition.workflowDefinition?.cooldownSeconds ?? 0)
    setTriggers(document.triggers ?? [])
    setConditions(document.conditions ?? [])
    setActions(document.actions ?? [])

    setInitialized(true)
  }, [definition, initialized])

  useEffect(() => {
    if (templateId && !workflowId) {
      setEditorMode('form')
    }
  }, [templateId, workflowId])

  useEffect(() => {
    if (workflowId || initialized || !template) return

    const document = parseDefinitionJSON(template.definitionJSON)

    setName(document.name ?? template.name ?? '')
    setDescription(document.description ?? template.description ?? '')
    setSchemaType(document.schemaType ?? '')
    setWorkflowKind((document.workflowKind ?? WorkflowDefinitionWorkflowKind.APPROVAL) as WorkflowDefinitionWorkflowKind)
    setApprovalTiming(normalizeApprovalTiming(document?.approvalTiming))
    setTriggers(document.triggers ?? [])
    setConditions(document.conditions ?? [])
    setActions(document.actions ?? [])

    setInitialized(true)
  }, [workflowId, initialized, template])

  useEffect(() => {
    if (!workflowId && !initialized) {
      setInitialized(true)
    }
  }, [workflowId, initialized])

  const isSaving = createMutation.isPending || updateMutation.isPending
  const isLoading = isLoadingMetadata || isLoadingDefinition

  const handleSave = async () => {
    if (!name.trim()) {
      errorNotification({ title: 'Workflow name is required' })
      return
    }

    if (!schemaType) {
      errorNotification({ title: 'Schema type is required' })
      return
    }

    const workflowDocument: WorkflowDocument = {
      name: name.trim(),
      description: description.trim() || undefined,
      schemaType,
      workflowKind,
      approvalTiming: workflowKind === WorkflowDefinitionWorkflowKind.APPROVAL ? approvalTiming : undefined,
      approvalSubmissionMode: workflowKind === WorkflowDefinitionWorkflowKind.APPROVAL ? DEFAULT_APPROVAL_SUBMISSION_MODE : undefined,
      version: DEFAULT_VERSION,
      targets: {},
      triggers,
      conditions,
      actions: sanitizeActions(actions),
      metadata: {},
    }

    try {
      if (workflowId) {
        const input: UpdateWorkflowDefinitionInput = {
          name: name.trim(),
          description: description.trim() || undefined,
          schemaType,
          workflowKind,
          active,
          draft,
          isDefault,
          cooldownSeconds,
          definitionJSON: workflowDocument,
        }

        await updateMutation.mutateAsync({ updateWorkflowDefinitionId: workflowId, input })
        successNotification({
          title: 'Workflow updated',
          description: 'Your workflow definition was updated successfully.',
        })
      } else {
        const input: CreateWorkflowDefinitionInput = {
          name: name.trim(),
          description: description.trim() || undefined,
          schemaType,
          workflowKind,
          active,
          draft,
          isDefault,
          cooldownSeconds,
          definitionJSON: workflowDocument,
        }

        await createMutation.mutateAsync({ input: input })
        successNotification({
          title: 'Workflow created',
          description: 'Your workflow definition was created successfully.',
        })
      }

      router.push('/automation/workflows')
    } catch (error) {
      const message = parseErrorMessage(error)
      errorNotification({
        title: 'Unable to save workflow',
        description: message,
      })
    }
  }

  const workflowKindOptions = useMemo(() => Object.values(WorkflowDefinitionWorkflowKind), [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="p-0">Workflow Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Control approval workflow" />
            </div>
            <div className="space-y-2">
              <Label>Schema Type</Label>
              <Select
                value={schemaType}
                onValueChange={(val) => {
                  setSchemaType(val)
                  setTriggers((prev) => prev.map((t) => ({ ...t, objectType: val })))
                }}
                disabled={isLoadingMetadata}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingMetadata ? 'Loading types...' : 'Select object type'} />
                </SelectTrigger>
                <SelectContent>
                  {objectTypes.map((obj) => (
                    <SelectItem key={obj.type} value={obj.type}>
                      {obj.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what this workflow does" rows={3} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="p-0">Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Workflow Kind</Label>
            <Select value={workflowKind} onValueChange={(val) => setWorkflowKind(val as WorkflowDefinitionWorkflowKind)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {workflowKindOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {workflowKind === WorkflowDefinitionWorkflowKind.APPROVAL && (
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
              <p className="text-xs text-muted-foreground">Choose when approvals are required for this workflow.</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Cooldown (seconds)</Label>
            <Input type="number" min="0" value={cooldownSeconds} onChange={(e) => setCooldownSeconds(Number(e.target.value) || 0)} />
          </div>

          <div className="flex items-center justify-between">
            <Label>Active</Label>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>

          <div className="flex items-center justify-between">
            <Label>Draft</Label>
            <Switch checked={draft} onCheckedChange={setDraft} />
          </div>

          <div className="flex items-center justify-between">
            <Label>Default for schema</Label>
            <Switch checked={isDefault} onCheckedChange={setIsDefault} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="p-0">Workflow Builder</CardTitle>
            <Tabs value={editorMode} onValueChange={(value) => setEditorMode(value as 'visual' | 'form')}>
              <TabsList>
                <TabsTrigger value="form">Form</TabsTrigger>
                <TabsTrigger value="visual">Visual</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading || !initialized ? (
            <p className="text-sm text-muted-foreground">Loading workflow builder...</p>
          ) : editorMode === 'visual' ? (
            <WorkflowVisualEditor
              triggers={triggers}
              conditions={conditions}
              actions={actions}
              objectTypes={objectTypes}
              onUpdate={(nextTriggers, nextConditions, nextActions) => {
                setTriggers(nextTriggers)
                setConditions(nextConditions)
                setActions(nextActions)
              }}
            />
          ) : (
            <WorkflowFormEditor
              triggers={triggers}
              conditions={conditions}
              actions={actions}
              objectTypes={objectTypes}
              schemaType={schemaType}
              onUpdate={(nextTriggers, nextConditions, nextActions) => {
                setTriggers(nextTriggers)
                setConditions(nextConditions)
                setActions(nextActions)
              }}
            />
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => router.push('/automation/workflows')} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving || isLoading}>
          {workflowId ? 'Save changes' : 'Create workflow'}
        </Button>
      </div>
    </div>
  )
}
