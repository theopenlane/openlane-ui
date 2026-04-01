'use client'

import { useEffect, useMemo, useState } from 'react'
import type { WorkflowObjectTypeMetadata } from '@/lib/graphql-hooks/workflows'
import { useUserSelect } from '@/lib/graphql-hooks/member'
import { useGroupSelect } from '@/lib/graphql-hooks/group'
import type { Target } from '@/components/pages/protected/workflows/types'
import { TriggerFormSection } from '@/components/workflows/form-editor/trigger-form-section'
import { ConditionFormSection } from '@/components/workflows/form-editor/condition-form-section'
import { ActionFormSection } from '@/components/workflows/form-editor/action-form-section'

type WorkflowFormEditorProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  triggers: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  conditions: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actions: any[]
  objectTypes: WorkflowObjectTypeMetadata[]
  schemaType: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate: (nextTriggers: any[], nextConditions: any[], nextActions: any[]) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizeTargets = (params: any): Target[] => {
  if (!params) return []
  if (Array.isArray(params.targets)) return params.targets

  const legacyAssignees = params.assignees
  if (!legacyAssignees) return []

  const users = Array.isArray(legacyAssignees.users) ? legacyAssignees.users : []
  const groups = Array.isArray(legacyAssignees.groups) ? legacyAssignees.groups : []

  return [...users.map((id: string) => ({ type: 'USER' as const, id })), ...groups.map((id: string) => ({ type: 'GROUP' as const, id }))]
}

export const WorkflowFormEditor = ({ triggers, conditions, actions, objectTypes, schemaType, onUpdate }: WorkflowFormEditorProps) => {
  const { userOptions, isLoading: isLoadingUsers } = useUserSelect({})
  const { groupOptions, isLoading: isLoadingGroups } = useGroupSelect()
  const resolverKeys = useMemo(() => objectTypes[0]?.resolverKeys ?? [], [objectTypes])

  const [actionParamsDrafts, setActionParamsDrafts] = useState<Record<number, { value: string; error?: string }>>({})
  const [edgeInputs, setEdgeInputs] = useState<Record<number, string>>({})

  useEffect(() => {
    const nextDrafts: Record<number, { value: string; error?: string }> = {}
    actions.forEach((action, index) => {
      if (action.type === 'REQUEST_APPROVAL' || action.type === 'REQUEST_REVIEW') return
      const value = JSON.stringify(action.params ?? {}, null, 2)
      nextDrafts[index] = actionParamsDrafts[index] ?? { value }
    })
    setActionParamsDrafts(nextDrafts)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateTriggers = (nextTriggers: any[]) => onUpdate(nextTriggers, conditions, actions)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateConditions = (nextConditions: any[]) => onUpdate(triggers, nextConditions, actions)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateActions = (nextActions: any[]) => onUpdate(triggers, conditions, nextActions)

  const addTrigger = () => {
    const defaultType = schemaType || objectTypes[0]?.type || 'Control'
    updateTriggers([...triggers, { operation: 'UPDATE', objectType: defaultType, fields: [], edges: [], description: '', expression: '' }])
  }

  const removeTrigger = (index: number) => updateTriggers(triggers.filter((_, i) => i !== index))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateTrigger = (index: number, field: string, value: any) => {
    const updated = [...triggers]
    updated[index] = { ...updated[index], [field]: value }
    updateTriggers(updated)
  }

  const addCondition = () => updateConditions([...conditions, { expression: 'true', description: '' }])
  const removeCondition = (index: number) => updateConditions(conditions.filter((_, i) => i !== index))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateCondition = (index: number, field: string, value: any) => {
    const updated = [...conditions]
    updated[index] = { ...updated[index], [field]: value }
    updateConditions(updated)
  }

  const addAction = () => {
    updateActions([
      ...actions,
      { key: `action-${actions.length + 1}`, type: 'REQUEST_APPROVAL', description: '', when: '', params: { targets: [], required: true, required_count: 1, label: '', fields: [] } },
    ])
  }

  const removeAction = (index: number) => updateActions(actions.filter((_, i) => i !== index))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateAction = (index: number, field: string, value: any) => {
    const updated = [...actions]
    updated[index] = { ...updated[index], [field]: value }
    updateActions(updated)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateActionParam = (index: number, paramField: string, value: any) => {
    const updated = [...actions]
    updated[index] = { ...updated[index], params: { ...(updated[index].params ?? {}), [paramField]: value } }
    updateActions(updated)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getApprovalTargets = (action: any) => normalizeTargets(action.params ?? {})

  const handleAddTarget = (index: number, target: Target) => {
    const current = getApprovalTargets(actions[index])
    const exists = current.some((t) => t.type === target.type && (t.id ? t.id === target.id : t.resolver_key === target.resolver_key))
    if (exists) return
    updateActionParam(index, 'targets', [...current, target])
  }

  const handleRemoveTarget = (index: number, target: Target) => {
    const current = getApprovalTargets(actions[index])
    const next = current.filter((t) => {
      if (target.type === 'USER' || target.type === 'GROUP') return !(t.type === target.type && t.id === target.id)
      if (target.type === 'RESOLVER') return !(t.type === 'RESOLVER' && t.resolver_key === target.resolver_key)
      return true
    })
    updateActionParam(index, 'targets', next)
  }

  const handleActionParamsChange = (index: number, value: string) => {
    setActionParamsDrafts((prev) => ({ ...prev, [index]: { value } }))
    try {
      const parsed = value.trim() ? JSON.parse(value) : {}
      updateAction(index, 'params', parsed)
      setActionParamsDrafts((prev) => ({ ...prev, [index]: { value, error: undefined } }))
    } catch {
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

  const eligibleEdgesByType = useMemo(() => new Map(objectTypes.map((t) => [t.type, t.eligibleEdges ?? []])), [objectTypes])

  const updateEdgeInput = (index: number, value: string) => setEdgeInputs((prev) => ({ ...prev, [index]: value }))

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
    updateTrigger(
      index,
      'edges',
      currentEdges.filter((e: string) => e !== edge),
    )
  }

  return (
    <div className="space-y-6">
      <TriggerFormSection
        triggers={triggers}
        objectTypes={objectTypes}
        eligibleEdgesByType={eligibleEdgesByType}
        edgeInputs={edgeInputs}
        onAddTrigger={addTrigger}
        onRemoveTrigger={removeTrigger}
        onUpdateTrigger={updateTrigger}
        onUpdateEdgeInput={updateEdgeInput}
        onAddEdge={addEdgeToTrigger}
        onRemoveEdge={removeEdgeFromTrigger}
      />

      <ConditionFormSection
        conditions={conditions}
        objectTypes={objectTypes}
        schemaType={schemaType}
        onAddCondition={addCondition}
        onRemoveCondition={removeCondition}
        onUpdateCondition={updateCondition}
      />

      <ActionFormSection
        actions={actions}
        eligibleFields={eligibleFields}
        resolverKeys={resolverKeys}
        userOptions={userOptions}
        groupOptions={groupOptions}
        isLoadingUsers={isLoadingUsers}
        isLoadingGroups={isLoadingGroups}
        actionParamsDrafts={actionParamsDrafts}
        getApprovalTargets={getApprovalTargets}
        onAddAction={addAction}
        onRemoveAction={removeAction}
        onUpdateAction={updateAction}
        onUpdateActionParam={updateActionParam}
        onActionParamsChange={handleActionParamsChange}
        onWebhookPayloadTextUpdate={updateWebhookPayloadText}
        onAddTarget={handleAddTarget}
        onRemoveTarget={handleRemoveTarget}
      />
    </div>
  )
}
