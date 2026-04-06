'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Node } from '@xyflow/react'
import { PanelRightClose, Trash2 } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Textarea } from '@repo/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Badge } from '@repo/ui/badge'
import { Switch } from '@repo/ui/switch'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { TRIGGER_OPERATION_OPTIONS } from '@/lib/workflow-templates'
import type { WorkflowObjectTypeMetadata } from '@/lib/graphql-hooks/workflows'
import { toHumanLabel } from '@/utils/strings'
import { CELConditionBuilder } from '@/components/workflows/cel-condition-builder'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog'
import { TargetSelector } from '@/components/pages/protected/workflows/wizard/components/target-selector'
import { buildTargetKey, normalizeTargets, getTargetLabel } from '@/components/pages/protected/workflows/wizard/utils'
import type { Target, WorkflowAction, WorkflowActionParams, WorkflowActionType, WorkflowCondition, WorkflowNodeData, WorkflowTrigger, WorkflowTriggerOperation } from '@/types/workflow'

type WorkflowEditorNode = Node<WorkflowNodeData, 'trigger' | 'condition' | 'action'>

const isTriggerData = (data: WorkflowNodeData | null): data is WorkflowTrigger => data !== null && 'operation' in data && 'objectType' in data
const isConditionData = (data: WorkflowNodeData | null): data is WorkflowCondition => data !== null && 'expression' in data && !('key' in data)
const isActionData = (data: WorkflowNodeData | null): data is WorkflowAction => data !== null && 'key' in data && 'type' in data

type NodeEditPanelProps = {
  node: WorkflowEditorNode | null
  objectTypes: WorkflowObjectTypeMetadata[]
  onClose: () => void
  onUpdate: (nodeId: string, data: WorkflowNodeData) => void
  onDelete: (nodeId: string) => void
}

export const NodeEditPanel = ({ node, objectTypes, onClose, onUpdate, onDelete }: NodeEditPanelProps) => {
  const [localData, setLocalData] = useState<WorkflowNodeData | null>(null)
  const [originalData, setOriginalData] = useState<WorkflowNodeData | null>(null)
  const [paramsInput, setParamsInput] = useState('')
  const [paramsError, setParamsError] = useState<string | null>(null)
  const [edgeInput, setEdgeInput] = useState('')
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const nodeType = node?.type
  const actionData = isActionData(localData) ? localData : null
  const triggerData = isTriggerData(localData) ? localData : null
  const conditionData = isConditionData(localData) ? localData : null

  useEffect(() => {
    if (!node) {
      setLocalData(null)
      setOriginalData(null)
      setParamsInput('')
      setParamsError(null)
      setEdgeInput('')
      return
    }

    if (isActionData(node.data)) {
      const params = { ...(node.data.params ?? {}) }
      params.targets = normalizeTargets(params)
      const nextData: WorkflowAction = { ...node.data, params }
      setLocalData(nextData)
      setOriginalData(structuredClone(nextData))
      if (nextData.type === 'REQUEST_APPROVAL' || nextData.type === 'REQUEST_REVIEW') {
        setParamsInput('')
      } else {
        setParamsInput(JSON.stringify(nextData.params ?? {}, null, 2))
      }
    } else {
      const nextData = { ...node.data }
      setLocalData(nextData)
      setOriginalData(structuredClone(nextData))
      setParamsInput('')
    }
    setParamsError(null)
    setEdgeInput('')
  }, [node])

  useEffect(() => {
    const type = actionData?.type
    if (!type || type === 'REQUEST_APPROVAL' || type === 'REQUEST_REVIEW') {
      setParamsInput('')
      setParamsError(null)
      return
    }

    setParamsInput(JSON.stringify(actionData.params ?? {}, null, 2))
    setParamsError(null)
  }, [actionData?.type, node?.id, actionData?.params])

  const isDirty = useMemo(() => {
    if (!localData || !originalData) return false
    return JSON.stringify(localData) !== JSON.stringify(originalData)
  }, [localData, originalData])

  const resolverKeys = useMemo(() => objectTypes[0]?.resolverKeys ?? [], [objectTypes])

  // Plain consts: cheap derived values; the React Compiler memoizes them automatically when
  // needed. Manual useMemo with optional-chained deps was fighting the compiler and caused it
  // to skip optimizing the entire component (react-hooks/preserve-manual-memoization).
  const targets: Target[] = Array.isArray(actionData?.params?.targets) ? actionData.params.targets : []

  const triggerEdges = Array.isArray(triggerData?.edges) ? triggerData.edges : []

  const eligibleEdges = triggerData?.objectType ? (objectTypes.find((t) => t.type === triggerData.objectType)?.eligibleEdges ?? []) : []

  const hasEligibleEdges = eligibleEdges.length > 0

  const updateTriggerData = <K extends keyof WorkflowTrigger>(field: K, value: WorkflowTrigger[K]) => {
    if (!triggerData) return
    setLocalData({ ...triggerData, [field]: value })
  }

  const updateConditionData = <K extends keyof WorkflowCondition>(field: K, value: WorkflowCondition[K]) => {
    if (!conditionData) return
    setLocalData({ ...conditionData, [field]: value })
  }

  const updateActionData = <K extends keyof WorkflowAction>(field: K, value: WorkflowAction[K]) => {
    if (!actionData) return
    setLocalData({ ...actionData, [field]: value })
  }

  const updateActionParam = <K extends keyof WorkflowActionParams>(field: K, value: WorkflowActionParams[K]) => {
    if (!actionData) return
    setLocalData({
      ...actionData,
      params: { ...(actionData.params ?? {}), [field]: value },
    })
  }

  const handleAddTarget = (target: Target) => {
    if (!actionData) return
    const exists = targets.some((item) => buildTargetKey(item) === buildTargetKey(target))
    if (exists) return
    updateActionParam('targets', [...targets, target])
  }

  const handleRemoveTarget = (target: Target) => {
    if (!actionData) return
    updateActionParam(
      'targets',
      targets.filter((item) => buildTargetKey(item) !== buildTargetKey(target)),
    )
  }

  const handleParamsChange = (value: string) => {
    if (!actionData) return
    setParamsInput(value)
    try {
      const raw: unknown = value.trim() ? JSON.parse(value) : {}
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        setParamsError('Params must be a JSON object')
        return
      }
      setParamsError(null)
      setLocalData({
        ...actionData,
        params: raw as WorkflowActionParams,
      })
    } catch {
      setParamsError('Invalid JSON')
    }
  }

  const handleSave = () => {
    if (!node || !localData) return
    if (paramsError) return
    onUpdate(node.id, localData)
    onClose()
  }

  const handleDelete = () => {
    if (!node) return
    onDelete(node.id)
    onClose()
  }

  const handleSheetClose = () => {
    if (isDirty) {
      setShowCancelDialog(true)
      return
    }
    onClose()
  }

  const canAddEdge = edgeInput.trim().length > 0 && !triggerEdges.includes(edgeInput.trim())
  const handleAddEdge = () => {
    if (!triggerData || !canAddEdge) return
    const nextEdges = [...triggerEdges, edgeInput.trim()]
    updateTriggerData('edges', nextEdges)
    setEdgeInput('')
  }
  const handleRemoveEdge = (edge: string) => {
    if (!triggerData) return
    updateTriggerData(
      'edges',
      triggerEdges.filter((currentEdge) => currentEdge !== edge),
    )
  }

  return (
    <>
      <Sheet open={!!node} onOpenChange={(open) => !open && handleSheetClose()}>
        <SheetContent className="w-100 sm:w-135 overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="sr-only">
              Edit {nodeType?.charAt(0).toUpperCase()}
              {nodeType?.slice(1)}
            </SheetTitle>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PanelRightClose aria-label="Close panel" size={16} className="cursor-pointer" onClick={handleSheetClose} />
                <span className="text-lg">
                  Edit {nodeType?.charAt(0).toUpperCase()}
                  {nodeType?.slice(1)}
                </span>
              </div>
              <div className="flex justify-end gap-2 mr-6">
                <Button variant="secondary" onClick={handleSave} disabled={Boolean(paramsError)}>
                  Save
                </Button>
                <Button icon={<Trash2 size={16} />} iconPosition="left" variant="secondary" onClick={() => setShowDeleteConfirm(true)}>
                  Delete
                </Button>
                <ConfirmationDialog
                  open={showDeleteConfirm}
                  onOpenChange={setShowDeleteConfirm}
                  onConfirm={handleDelete}
                  title="Delete node?"
                  description="This will permanently remove this node from the workflow."
                  confirmationText="Delete"
                  confirmationTextVariant="destructive"
                  showInput={false}
                />
              </div>
            </div>
          </SheetHeader>
          {localData && (
            <div className="mt-6 space-y-4">
              {triggerData && (
                <>
                  <div className="space-y-2">
                    <Label>Operation</Label>
                    <Select value={triggerData.operation} onValueChange={(val) => updateTriggerData('operation', val as WorkflowTriggerOperation)}>
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
                    <Label>Object Type</Label>
                    <Select value={triggerData.objectType} onValueChange={(val) => updateTriggerData('objectType', val)}>
                      <SelectTrigger>
                        <SelectValue />
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

                  <div className="space-y-2">
                    <Label>Tracked Fields</Label>
                    {triggerData.objectType && objectTypes.find((t) => t.type === triggerData.objectType)?.eligibleFields.length ? (
                      <div className="space-y-2 border rounded-md p-2 max-h-48 overflow-auto">
                        {objectTypes
                          .find((t) => t.type === triggerData.objectType)
                          ?.eligibleFields.map((field) => (
                            <div key={field.name} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`edit-field-${field.name}`}
                                checked={triggerData.fields?.includes(field.name) || false}
                                onChange={(e) => {
                                  const currentFields = triggerData.fields ?? []
                                  const newFields = e.target.checked ? [...currentFields, field.name] : currentFields.filter((currentField) => currentField !== field.name)
                                  updateTriggerData('fields', newFields)
                                }}
                                className="h-4 w-4 rounded border-gray-300"
                              />
                              <label htmlFor={`edit-field-${field.name}`} className="text-xs font-medium">
                                {field.label}
                              </label>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Select an object type</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Tracked Edges (optional)</Label>
                    {hasEligibleEdges ? (
                      <div className="flex gap-2">
                        <Select value={edgeInput} onValueChange={(val) => setEdgeInput(val)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an edge" />
                          </SelectTrigger>
                          <SelectContent>
                            {eligibleEdges.map((edge) => (
                              <SelectItem key={edge} value={edge}>
                                {toHumanLabel(edge)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" onClick={handleAddEdge} disabled={!canAddEdge}>
                          Add
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input value={edgeInput} onChange={(e) => setEdgeInput(e.target.value)} placeholder="controls" />
                        <Button type="button" variant="outline" onClick={handleAddEdge} disabled={!canAddEdge}>
                          Add
                        </Button>
                      </div>
                    )}
                    {triggerEdges.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {triggerEdges.map((edge) => (
                          <Badge key={edge} variant="secondary" className="gap-1">
                            {toHumanLabel(edge)}
                            <button type="button" className="ml-1 cursor-pointer" onClick={() => handleRemoveEdge(edge)}>
                              &times;
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">Use edge names from the object schema (for example: controls, evidence).</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={triggerData.description || ''} onChange={(e) => updateTriggerData('description', e.target.value)} placeholder="When to trigger" />
                  </div>

                  <div className="space-y-2">
                    <CELConditionBuilder
                      objectType={triggerData.objectType}
                      objectTypes={objectTypes}
                      initialExpression={triggerData.expression || 'true'}
                      onChange={(expr) => updateTriggerData('expression', expr)}
                    />
                  </div>
                </>
              )}

              {conditionData && (
                <>
                  <div className="space-y-2">
                    <CELConditionBuilder objectTypes={objectTypes} initialExpression={conditionData.expression || 'true'} onChange={(expr) => updateConditionData('expression', expr)} />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={conditionData.description || ''} onChange={(e) => updateConditionData('description', e.target.value)} placeholder="Explain this condition" />
                  </div>
                </>
              )}

              {actionData && (
                <>
                  <div className="space-y-2">
                    <Label>Action Key</Label>
                    <Input value={actionData.key || ''} onChange={(e) => updateActionData('key', e.target.value)} placeholder="approval" />
                  </div>

                  <div className="space-y-2">
                    <Label>Action Type</Label>
                    <Select value={actionData.type} onValueChange={(val) => updateActionData('type', val as WorkflowActionType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="REQUEST_APPROVAL">Request Approval</SelectItem>
                        <SelectItem value="REQUEST_REVIEW">Review</SelectItem>
                        <SelectItem value="NOTIFY">Notify</SelectItem>
                        <SelectItem value="WEBHOOK">Webhook</SelectItem>
                        <SelectItem value="UPDATE_FIELD">Update Field</SelectItem>
                        <SelectItem value="INTEGRATION">Integration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={actionData.description || ''} onChange={(e) => updateActionData('description', e.target.value)} placeholder="What this action does" />
                  </div>

                  {(actionData.type === 'REQUEST_APPROVAL' || actionData.type === 'REQUEST_REVIEW') && (
                    <>
                      <div className="space-y-2">
                        <Label>{actionData.type === 'REQUEST_REVIEW' ? 'Review label' : 'Approval label'}</Label>
                        <Input value={actionData.params?.label || ''} onChange={(e) => updateActionParam('label', e.target.value)} placeholder="Approval label" />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Required for completion</Label>
                        <Switch checked={actionData.params?.required ?? true} onCheckedChange={(checked) => updateActionParam('required', checked)} />
                      </div>

                      <div className="space-y-2">
                        <Label>{actionData.type === 'REQUEST_REVIEW' ? 'Required reviews' : 'Required approvals'}</Label>
                        <Input type="number" min="0" value={actionData.params?.required_count ?? 1} onChange={(e) => updateActionParam('required_count', parseInt(e.target.value, 10) || 0)} />
                        <p className="text-xs text-muted-foreground">Use 0 to require all targets.</p>
                      </div>

                      <TargetSelector targets={targets} onAdd={handleAddTarget} onRemove={handleRemoveTarget} resolverKeys={resolverKeys} getTargetLabel={getTargetLabel} />
                    </>
                  )}

                  {actionData.type !== 'REQUEST_APPROVAL' && actionData.type !== 'REQUEST_REVIEW' && (
                    <div className="space-y-2">
                      <Label>Action Parameters (JSON)</Label>
                      <Textarea value={paramsInput} onChange={(e) => handleParamsChange(e.target.value)} placeholder='{"key": "value"}' rows={6} />
                      {paramsError && <p className="text-xs text-destructive">{paramsError}</p>}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <CancelDialog
        isOpen={showCancelDialog}
        onConfirm={() => {
          setShowCancelDialog(false)
          onClose()
        }}
        onCancel={() => setShowCancelDialog(false)}
      />
    </>
  )
}
