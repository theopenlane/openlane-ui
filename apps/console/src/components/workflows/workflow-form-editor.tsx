'use client'

import { useEffect, useMemo, useState } from 'react'
import type { WorkflowObjectTypeMetadata } from '@/lib/graphql-hooks/workflows'
import type { Target, UpdateWorkflowAction, UpdateWorkflowActionParam, UpdateWorkflowCondition, UpdateWorkflowTrigger, WorkflowAction, WorkflowCondition, WorkflowTrigger } from '@/types/workflow'
import { normalizeTargets } from '@/components/pages/protected/workflows/wizard/utils'
import { TriggerFormSection } from '@/components/workflows/form-editor/trigger-form-section'
import { ConditionFormSection } from '@/components/workflows/form-editor/condition-form-section'
import { ActionFormSection } from '@/components/workflows/form-editor/action-form-section'

type WorkflowFormEditorProps = {
  triggers: WorkflowTrigger[]
  conditions: WorkflowCondition[]
  actions: WorkflowAction[]
  objectTypes: WorkflowObjectTypeMetadata[]
  schemaType: string
  onUpdate: (nextTriggers: WorkflowTrigger[], nextConditions: WorkflowCondition[], nextActions: WorkflowAction[]) => void
}

export const WorkflowFormEditor = ({ triggers, conditions, actions, objectTypes, schemaType, onUpdate }: WorkflowFormEditorProps) => {
  const resolverKeys = useMemo(() => objectTypes[0]?.resolverKeys ?? [], [objectTypes])

  const [actionParamsDrafts, setActionParamsDrafts] = useState<Record<number, { value: string; error?: string }>>({})
  const [edgeInputs, setEdgeInputs] = useState<Record<number, string>>({})

  useEffect(() => {
    setActionParamsDrafts((prev) => {
      const nextDrafts: Record<number, { value: string; error?: string }> = {}
      actions.forEach((action, index) => {
        if (action.type === 'REQUEST_APPROVAL' || action.type === 'REQUEST_REVIEW') return
        const value = JSON.stringify(action.params ?? {}, null, 2)
        nextDrafts[index] = prev[index] ?? { value }
      })
      return nextDrafts
    })
  }, [actions])

  const updateTriggers = (nextTriggers: WorkflowTrigger[]) => onUpdate(nextTriggers, conditions, actions)
  const updateConditions = (nextConditions: WorkflowCondition[]) => onUpdate(triggers, nextConditions, actions)
  const updateActions = (nextActions: WorkflowAction[]) => onUpdate(triggers, conditions, nextActions)

  const addTrigger = () => {
    const defaultType = schemaType || objectTypes[0]?.type || 'Control'
    updateTriggers([...triggers, { operation: 'UPDATE', objectType: defaultType, fields: [], edges: [], description: '', expression: '' }])
  }

  const removeTrigger = (index: number) => updateTriggers(triggers.filter((_, i) => i !== index))

  const updateTrigger: UpdateWorkflowTrigger = (index, field, value) => {
    const updated = [...triggers]
    updated[index] = { ...updated[index], [field]: value }
    updateTriggers(updated)
  }

  const addCondition = () => updateConditions([...conditions, { expression: 'true', description: '' }])
  const removeCondition = (index: number) => updateConditions(conditions.filter((_, i) => i !== index))

  const updateCondition: UpdateWorkflowCondition = (index, field, value) => {
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

  const updateAction: UpdateWorkflowAction = (index, field, value) => {
    const updated = [...actions]
    updated[index] = { ...updated[index], [field]: value }
    updateActions(updated)
  }

  const updateActionParam: UpdateWorkflowActionParam = (index, paramField, value) => {
    const updated = [...actions]
    updated[index] = { ...updated[index], params: { ...(updated[index].params ?? {}), [paramField]: value } }
    updateActions(updated)
  }

  const getApprovalTargets = (action: WorkflowAction) => normalizeTargets(action.params)

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
      currentEdges.filter((currentEdge) => currentEdge !== edge),
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
        actionParamsDrafts={actionParamsDrafts}
        getApprovalTargets={getApprovalTargets}
        onAddAction={addAction}
        onRemoveAction={removeAction}
        onUpdateAction={updateAction}
        onUpdateActionParam={updateActionParam}
        onActionParamsChange={handleActionParamsChange}
        onAddTarget={handleAddTarget}
        onRemoveTarget={handleRemoveTarget}
      />
    </div>
  )
}
