'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/cardpanel'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Textarea } from '@repo/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Switch } from '@repo/ui/switch'
import { Badge } from '@repo/ui/badge'
import { Separator } from '@repo/ui/separator'
import { TRIGGER_OPERATION_OPTIONS } from '@/lib/workflow-templates'
import { WorkflowObjectTypeMetadata } from '@/lib/graphql-hooks/workflows'
import { useUserSelect } from '@/lib/graphql-hooks/members'
import { useGroupSelect } from '@/lib/graphql-hooks/groups'
import { CELConditionBuilder } from '@/components/workflows/cel-condition-builder'

type WorkflowFormEditorProps = {
  triggers: any[]
  conditions: any[]
  actions: any[]
  objectTypes: WorkflowObjectTypeMetadata[]
  schemaType: string
  onUpdate: (nextTriggers: any[], nextConditions: any[], nextActions: any[]) => void
}

type Target = {
  type: 'USER' | 'GROUP' | 'ROLE' | 'RESOLVER'
  id?: string
  resolver_key?: string
}

const normalizeTargets = (params: any): Target[] => {
  if (!params) return []
  if (Array.isArray(params.targets)) return params.targets

  const legacyAssignees = params.assignees
  if (!legacyAssignees) return []

  const users = Array.isArray(legacyAssignees.users) ? legacyAssignees.users : []
  const groups = Array.isArray(legacyAssignees.groups) ? legacyAssignees.groups : []

  return [
    ...users.map((id: string) => ({ type: 'USER' as const, id })),
    ...groups.map((id: string) => ({ type: 'GROUP' as const, id })),
  ]
}

const ACTION_TYPE_OPTIONS = [
  { label: 'Request Approval', value: 'REQUEST_APPROVAL' },
  { label: 'Review', value: 'REVIEW' },
  { label: 'Notify', value: 'NOTIFY' },
  { label: 'Webhook', value: 'WEBHOOK' },
  { label: 'Field Update', value: 'FIELD_UPDATE' },
]

const WEBHOOK_METHOD_OPTIONS = ['POST', 'PUT', 'PATCH', 'GET']

export function WorkflowFormEditor({ triggers, conditions, actions, objectTypes, schemaType, onUpdate }: WorkflowFormEditorProps) {
  const { userOptions, isLoading: isLoadingUsers } = useUserSelect({})
  const { groupOptions, isLoading: isLoadingGroups } = useGroupSelect()
  const resolverKeys = useMemo(() => objectTypes[0]?.resolverKeys ?? [], [objectTypes])

  const [actionParamsDrafts, setActionParamsDrafts] = useState<Record<number, { value: string; error?: string }>>({})
  const [edgeInputs, setEdgeInputs] = useState<Record<number, string>>({})

  useEffect(() => {
    const nextDrafts: Record<number, { value: string; error?: string }> = {}
    actions.forEach((action, index) => {
      if (action.type === 'REQUEST_APPROVAL' || action.type === 'REVIEW') return
      const value = JSON.stringify(action.params ?? {}, null, 2)
      nextDrafts[index] = actionParamsDrafts[index] ?? { value }
    })
    setActionParamsDrafts(nextDrafts)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions])

  const updateTriggers = (nextTriggers: any[]) => onUpdate(nextTriggers, conditions, actions)
  const updateConditions = (nextConditions: any[]) => onUpdate(triggers, nextConditions, actions)
  const updateActions = (nextActions: any[]) => onUpdate(triggers, conditions, nextActions)

  const addTrigger = () => {
    const defaultType = schemaType || objectTypes[0]?.type || 'Control'
    updateTriggers([
      ...triggers,
      {
        operation: 'UPDATE',
        objectType: defaultType,
        fields: [],
        edges: [],
        description: '',
        expression: '',
      },
    ])
  }

  const removeTrigger = (index: number) => {
    updateTriggers(triggers.filter((_, i) => i !== index))
  }

  const updateTrigger = (index: number, field: string, value: any) => {
    const updated = [...triggers]
    updated[index] = { ...updated[index], [field]: value }
    updateTriggers(updated)
  }

  const addCondition = () => {
    updateConditions([...conditions, { expression: 'true', description: '' }])
  }

  const removeCondition = (index: number) => {
    updateConditions(conditions.filter((_, i) => i !== index))
  }

  const updateCondition = (index: number, field: string, value: any) => {
    const updated = [...conditions]
    updated[index] = { ...updated[index], [field]: value }
    updateConditions(updated)
  }

  const addAction = () => {
    updateActions([
      ...actions,
      {
        key: `action-${actions.length + 1}`,
        type: 'REQUEST_APPROVAL',
        description: '',
        when: '',
        params: {
          targets: [],
          required: true,
          required_count: 1,
          label: '',
          fields: [],
        },
      },
    ])
  }

  const removeAction = (index: number) => {
    updateActions(actions.filter((_, i) => i !== index))
  }

  const updateAction = (index: number, field: string, value: any) => {
    const updated = [...actions]
    updated[index] = { ...updated[index], [field]: value }
    updateActions(updated)
  }

  const updateActionParam = (index: number, paramField: string, value: any) => {
    const updated = [...actions]
    updated[index] = {
      ...updated[index],
      params: { ...(updated[index].params ?? {}), [paramField]: value },
    }
    updateActions(updated)
  }

  const getApprovalTargets = (action: any) => normalizeTargets(action.params ?? {})

  const setApprovalTargets = (index: number, nextTargets: Target[]) => {
    updateActionParam(index, 'targets', nextTargets)
  }

  const handleAddTarget = (index: number, target: Target) => {
    const current = getApprovalTargets(actions[index])
    const exists = current.some((t) => t.type === target.type && (t.id ? t.id === target.id : t.resolver_key === target.resolver_key))
    if (exists) return
    setApprovalTargets(index, [...current, target])
  }

  const handleRemoveTarget = (index: number, target: Target) => {
    const current = getApprovalTargets(actions[index])
    const next = current.filter((t) => {
      if (target.type === 'USER' || target.type === 'GROUP') {
        return !(t.type === target.type && t.id === target.id)
      }
      if (target.type === 'RESOLVER') {
        return !(t.type === 'RESOLVER' && t.resolver_key === target.resolver_key)
      }
      return true
    })
    setApprovalTargets(index, next)
  }

  const handleActionParamsChange = (index: number, value: string) => {
    setActionParamsDrafts((prev) => ({ ...prev, [index]: { value } }))
    try {
      const parsed = value.trim() ? JSON.parse(value) : {}
      updateAction(index, 'params', parsed)
      setActionParamsDrafts((prev) => ({ ...prev, [index]: { value, error: undefined } }))
    } catch (error) {
      setActionParamsDrafts((prev) => ({ ...prev, [index]: { value, error: 'Invalid JSON' } }))
    }
  }

  const updateWebhookPayloadText = (index: number, value: string) => {
    const currentPayload = actions[index]?.params?.payload
    const payload = currentPayload && typeof currentPayload === 'object' && !Array.isArray(currentPayload) ? { ...currentPayload } : {}
    if (value.trim()) {
      payload.text = value
    } else {
      delete payload.text
    }
    updateActionParam(index, 'payload', payload)
  }

  const eligibleFields = useMemo(() => {
    const selected = objectTypes.find((t) => t.type === schemaType) || objectTypes[0]
    return selected?.eligibleFields ?? []
  }, [objectTypes, schemaType])

  const eligibleEdgesByType = useMemo(() => {
    return new Map(objectTypes.map((t) => [t.type, t.eligibleEdges ?? []]))
  }, [objectTypes])

  const updateEdgeInput = (index: number, value: string) => {
    setEdgeInputs((prev) => ({ ...prev, [index]: value }))
  }

  const addEdgeToTrigger = (index: number) => {
    const input = edgeInputs[index]?.trim()
    if (!input) return
    const currentEdges = Array.isArray(triggers[index]?.edges) ? triggers[index].edges : []
    if (currentEdges.includes(input)) return
    updateTrigger(index, 'edges', [...currentEdges, input])
    updateEdgeInput(index, '')
  }

  const removeEdgeFromTrigger = (index: number, edge: string) => {
    const currentEdges = Array.isArray(triggers[index]?.edges) ? triggers[index].edges : []
    updateTrigger(index, 'edges', currentEdges.filter((e: string) => e !== edge))
  }

  return (
    <div className="space-y-6">
      <Card className="border border-muted-foreground/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Triggers</CardTitle>
              <CardDescription>Define when this workflow should execute.</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={addTrigger}>
              <Plus className="h-4 w-4 mr-1" />
              Add trigger
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {triggers.map((trigger, index) => {
            const eligibleEdges = eligibleEdgesByType.get(trigger.objectType) ?? []
            const hasEligibleEdges = eligibleEdges.length > 0

            return (
              <Card key={`trigger-${index}`} className="border-dashed">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Trigger {index + 1}</CardTitle>
                  {triggers.length > 1 && (
                    <Button size="sm" variant="transparent" onClick={() => removeTrigger(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Operation</Label>
                    <Select value={trigger.operation} onValueChange={(val) => updateTrigger(index, 'operation', val)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRIGGER_OPERATION_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Object type</Label>
                    <Select value={trigger.objectType} onValueChange={(val) => updateTrigger(index, 'objectType', val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select object type" />
                      </SelectTrigger>
                      <SelectContent>
                        {objectTypes.map((objType) => (
                          <SelectItem key={objType.type} value={objType.type}>
                            {objType.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tracked fields (leave empty for all)</Label>
                  {trigger.objectType && objectTypes.find((t) => t.type === trigger.objectType)?.eligibleFields.length ? (
                    <div className="space-y-2 border rounded-md p-3">
                      {objectTypes
                        .find((t) => t.type === trigger.objectType)
                        ?.eligibleFields.map((field) => (
                          <div key={field.name} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`trigger-${index}-field-${field.name}`}
                              checked={trigger.fields?.includes(field.name) || false}
                              onChange={(e) => {
                                const currentFields = trigger.fields || []
                                const newFields = e.target.checked
                                  ? [...currentFields, field.name]
                                  : currentFields.filter((f: string) => f !== field.name)
                                updateTrigger(index, 'fields', newFields)
                              }}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <label htmlFor={`trigger-${index}-field-${field.name}`} className="text-xs font-medium">
                              {field.label}
                            </label>
                          </div>
                        ))}
                      <p className="text-xs text-muted-foreground mt-2">
                        {trigger.fields?.length ? `${trigger.fields.length} field(s) selected` : 'No fields selected (tracks all fields)'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground border rounded-md p-3">
                      {trigger.objectType ? 'No workflow-eligible fields for this object type' : 'Select an object type to see available fields'}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Tracked edges (optional)</Label>
                  {hasEligibleEdges ? (
                    <div className="flex gap-2">
                      <Select value={edgeInputs[index] || ''} onValueChange={(val) => updateEdgeInput(index, val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an edge" />
                        </SelectTrigger>
                        <SelectContent>
                          {eligibleEdges.map((edge) => (
                            <SelectItem key={edge} value={edge}>
                              {edge}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addEdgeToTrigger(index)}
                        disabled={!edgeInputs[index]?.trim()}
                      >
                        Add
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={edgeInputs[index] || ''}
                        onChange={(e) => updateEdgeInput(index, e.target.value)}
                        placeholder="controls"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addEdgeToTrigger(index)}
                        disabled={!edgeInputs[index]?.trim()}
                      >
                        Add
                      </Button>
                    </div>
                  )}
                  {Array.isArray(trigger.edges) && trigger.edges.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {trigger.edges.map((edge: string) => (
                        <Badge key={edge} variant="secondary" className="gap-1">
                          {edge}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => removeEdgeFromTrigger(index, edge)} />
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Edge names map to schema relations (for example: controls, evidence).
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={trigger.description} onChange={(e) => updateTrigger(index, 'description', e.target.value)} placeholder="When to trigger this workflow" />
                </div>

                <div className="space-y-2">
                  <Label>CEL expression (optional)</Label>
                  <Textarea value={trigger.expression} onChange={(e) => updateTrigger(index, 'expression', e.target.value)} placeholder="true" rows={2} />
                </div>
              </CardContent>
            </Card>
            )
          })}
        </CardContent>
      </Card>

      <Card className="border border-muted-foreground/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Conditions</CardTitle>
              <CardDescription>CEL expressions that must evaluate to true for the workflow to proceed.</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={addCondition}>
              <Plus className="h-4 w-4 mr-1" />
              Add condition
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {conditions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No conditions. Workflow will always execute when triggered.</p>
          ) : (
            conditions.map((condition, index) => (
              <Card key={`condition-${index}`} className="border-dashed">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Condition {index + 1}</CardTitle>
                    <Button size="sm" variant="transparent" onClick={() => removeCondition(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <CELConditionBuilder
                    objectType={schemaType}
                    objectTypes={objectTypes}
                    initialExpression={condition.expression || 'true'}
                    onChange={(expression) => updateCondition(index, 'expression', expression)}
                  />
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={condition.description} onChange={(e) => updateCondition(index, 'description', e.target.value)} placeholder="Explain when this condition passes" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border border-muted-foreground/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Define what happens when the workflow executes.</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={addAction}>
              <Plus className="h-4 w-4 mr-1" />
              Add action
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {actions.map((action, index) => {
            const isApproval = action.type === 'REQUEST_APPROVAL'
            const isReview = action.type === 'REVIEW'
            const isApprovalLike = isApproval || isReview
            const isWebhook = action.type === 'WEBHOOK'
            const targets = getApprovalTargets(action)
            const selectedUsers = targets.filter((t) => t.type === 'USER' && t.id)
            const selectedGroups = targets.filter((t) => t.type === 'GROUP' && t.id)
            const selectedResolvers = targets.filter((t) => t.type === 'RESOLVER' && t.resolver_key).map((t) => t.resolver_key as string)
            const paramsDraft = actionParamsDrafts[index]
            const webhookPayloadText =
              action.params?.payload && typeof action.params.payload === 'object' && !Array.isArray(action.params.payload) ? action.params.payload.text || '' : ''
            return (
              <Card key={`action-${index}`} className="border-dashed">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Action {index + 1}</CardTitle>
                    {actions.length > 1 && (
                      <Button size="sm" variant="transparent" onClick={() => removeAction(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Action key *</Label>
                      <Input value={action.key} onChange={(e) => updateAction(index, 'key', e.target.value)} placeholder="approval" />
                    </div>

                    <div className="space-y-2">
                      <Label>Action type *</Label>
                      <Select value={action.type} onValueChange={(val) => updateAction(index, 'type', val)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTION_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={action.description} onChange={(e) => updateAction(index, 'description', e.target.value)} placeholder="What this action does" />
                  </div>

                  <div className="space-y-2">
                    <Label>When (optional)</Label>
                    <Input value={action.when || ''} onChange={(e) => updateAction(index, 'when', e.target.value)} placeholder="assignments.approved >= 1" />
                  </div>

                  {isApprovalLike ? (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <p className="text-sm font-medium">{isReview ? 'Review parameters' : 'Approval parameters'}</p>

                        <div className="space-y-2">
                          <Label>{isReview ? 'Review label' : 'Approval label'}</Label>
                          <Input
                            value={action.params?.label || ''}
                            onChange={(e) => updateActionParam(index, 'label', e.target.value)}
                            placeholder={isReview ? 'Review assignment label' : 'Approval assignment label'}
                          />
                        </div>

                        {isApproval && (
                          <div className="space-y-2">
                            <Label>Fields requiring approval</Label>
                            {eligibleFields.length ? (
                              <div className="space-y-2 border rounded-md p-3">
                                {eligibleFields.map((field) => (
                                  <div key={field.name} className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`action-${index}-field-${field.name}`}
                                      checked={action.params?.fields?.includes(field.name) || false}
                                      onChange={(e) => {
                                        const currentFields = action.params?.fields || []
                                        const newFields = e.target.checked
                                          ? [...currentFields, field.name]
                                          : currentFields.filter((f: string) => f !== field.name)
                                        updateActionParam(index, 'fields', newFields)
                                      }}
                                      className="h-4 w-4 rounded border-gray-300"
                                    />
                                    <label htmlFor={`action-${index}-field-${field.name}`} className="text-xs font-medium">
                                      {field.label}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground border rounded-md p-3">
                                No workflow-eligible fields available for this object type.
                              </p>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <Label>Required for completion</Label>
                          <Switch
                            checked={action.params?.required ?? true}
                            onCheckedChange={(checked) => updateActionParam(index, 'required', checked)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>{isReview ? 'Required reviews' : 'Required approvals'}</Label>
                          <Input
                            type="number"
                            min="0"
                            value={action.params?.required_count ?? 1}
                            onChange={(e) => updateActionParam(index, 'required_count', parseInt(e.target.value, 10) || 0)}
                          />
                          <p className="text-xs text-muted-foreground">Use 0 to require all targets.</p>
                        </div>

                        <div className="space-y-2">
                          <Label>Assign to Users</Label>
                          <Select onValueChange={(val) => handleAddTarget(index, { type: 'USER', id: val })} value="">
                            <SelectTrigger disabled={isLoadingUsers}>
                              <SelectValue placeholder={isLoadingUsers ? 'Loading users...' : 'Select user...'} />
                            </SelectTrigger>
                            <SelectContent>
                              {userOptions
                                .filter((u) => !selectedUsers.find((s) => s.id === u.value))
                                .map((user) => (
                                  <SelectItem key={user.value} value={user.value}>
                                    {user.label}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          {selectedUsers.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {selectedUsers.map((user) => (
                                <Badge key={user.id} variant="secondary" className="gap-1">
                                  {userOptions.find((u) => u.value === user.id)?.label || user.id}
                                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveTarget(index, { type: 'USER', id: user.id })} />
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Assign to Groups</Label>
                          <Select onValueChange={(val) => handleAddTarget(index, { type: 'GROUP', id: val })} value="">
                            <SelectTrigger disabled={isLoadingGroups}>
                              <SelectValue placeholder={isLoadingGroups ? 'Loading groups...' : 'Select group...'} />
                            </SelectTrigger>
                            <SelectContent>
                              {groupOptions
                                .filter((g) => !selectedGroups.find((s) => s.id === g.value))
                                .map((group) => (
                                  <SelectItem key={group.value} value={group.value}>
                                    {group.label}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          {selectedGroups.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {selectedGroups.map((group) => (
                                <Badge key={group.id} variant="secondary" className="gap-1">
                                  {groupOptions.find((g) => g.value === group.id)?.label || group.id}
                                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveTarget(index, { type: 'GROUP', id: group.id })} />
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {resolverKeys.length > 0 && (
                          <div className="space-y-2">
                            <Label>Assign via Resolver</Label>
                            <Select onValueChange={(val) => handleAddTarget(index, { type: 'RESOLVER', resolver_key: val })} value="">
                              <SelectTrigger>
                                <SelectValue placeholder="Select resolver..." />
                              </SelectTrigger>
                              <SelectContent>
                                {resolverKeys
                                  .filter((key) => !selectedResolvers.includes(key))
                                  .map((key) => (
                                    <SelectItem key={key} value={key}>
                                      {key}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            {selectedResolvers.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {selectedResolvers.map((resolverKey) => (
                                  <Badge key={resolverKey} variant="secondary" className="gap-1">
                                    {resolverKey}
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveTarget(index, { type: 'RESOLVER', resolver_key: resolverKey })} />
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  ) : isWebhook ? (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Webhook URL</Label>
                        <Input
                          value={action.params?.url || ''}
                          onChange={(e) => updateActionParam(index, 'url', e.target.value)}
                          placeholder="https://hooks.slack.com/..."
                        />
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Method</Label>
                          <Select value={action.params?.method || 'POST'} onValueChange={(val) => updateActionParam(index, 'method', val)}>
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

                        <div className="space-y-2">
                          <Label>Timeout (ms)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={action.params?.timeout_ms ?? 5000}
                            onChange={(e) => updateActionParam(index, 'timeout_ms', Number(e.target.value) || 0)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Message template</Label>
                        <Textarea
                          value={webhookPayloadText}
                          onChange={(e) => updateWebhookPayloadText(index, e.target.value)}
                          placeholder="Control status approved. Control details are included in the payload."
                          rows={4}
                        />
                        <p className="text-xs text-muted-foreground">Templates can reference workflow variables (e.g. {{object_id}}).</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Action Parameters (JSON)</Label>
                      <Textarea
                        value={paramsDraft?.value ?? JSON.stringify(action.params ?? {}, null, 2)}
                        onChange={(e) => handleActionParamsChange(index, e.target.value)}
                        placeholder='{"key": "value"}'
                        rows={6}
                      />
                      {paramsDraft?.error && <p className="text-xs text-destructive">{paramsDraft.error}</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
