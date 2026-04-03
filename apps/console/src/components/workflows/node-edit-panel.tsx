'use client'

import { useEffect, useMemo, useState } from 'react'
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
import type { Target } from '@/components/pages/protected/workflows/types'

type NodeEditPanelProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  node: any | null
  objectTypes: WorkflowObjectTypeMetadata[]
  onClose: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate: (nodeId: string, data: any) => void
  onDelete: (nodeId: string) => void
}

export const NodeEditPanel = ({ node, objectTypes, onClose, onUpdate, onDelete }: NodeEditPanelProps) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [localData, setLocalData] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [originalData, setOriginalData] = useState<any>(null)
  const [paramsInput, setParamsInput] = useState('')
  const [paramsError, setParamsError] = useState<string | null>(null)
  const [edgeInput, setEdgeInput] = useState('')
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (node) {
      const nextData = { ...node.data }
      if (node.type === 'action') {
        const params = { ...(nextData.params ?? {}) }
        params.targets = normalizeTargets(params)
        nextData.params = params
      }
      setLocalData(nextData)
      setOriginalData(JSON.parse(JSON.stringify(nextData)))
      setEdgeInput('')
    }
  }, [node])

  useEffect(() => {
    if (!localData || node?.type !== 'action') return
    if (localData.type === 'REQUEST_APPROVAL' || localData.type === 'REQUEST_REVIEW') return

    const serialized = JSON.stringify(localData.params ?? {}, null, 2)
    setParamsInput(serialized)
    setParamsError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localData?.type, node?.type])

  const isDirty = useMemo(() => {
    if (!localData || !originalData) return false
    return JSON.stringify(localData) !== JSON.stringify(originalData)
  }, [localData, originalData])

  const resolverKeys = useMemo(() => objectTypes[0]?.resolverKeys ?? [], [objectTypes])

  const targets: Target[] = useMemo(() => {
    if (!localData?.params?.targets) return []
    return Array.isArray(localData.params.targets) ? localData.params.targets : []
  }, [localData?.params?.targets])

  const triggerEdges = useMemo(() => {
    if (!localData?.edges) return []
    return Array.isArray(localData.edges) ? localData.edges : []
  }, [localData?.edges])

  const eligibleEdges = useMemo(() => {
    if (!localData?.objectType) return []
    return objectTypes.find((t) => t.type === localData.objectType)?.eligibleEdges ?? []
  }, [localData?.objectType, objectTypes])

  const hasEligibleEdges = eligibleEdges.length > 0

  const handleAddTarget = (target: Target) => {
    const exists = targets.some((t) => buildTargetKey(t) === buildTargetKey(target))
    if (exists) return
    setLocalData({
      ...localData,
      params: { ...(localData.params ?? {}), targets: [...targets, target] },
    })
  }

  const handleRemoveTarget = (target: Target) => {
    setLocalData({
      ...localData,
      params: { ...(localData.params ?? {}), targets: targets.filter((t) => buildTargetKey(t) !== buildTargetKey(target)) },
    })
  }

  const handleParamsChange = (value: string) => {
    setParamsInput(value)
    try {
      const parsed = value.trim() ? JSON.parse(value) : {}
      setParamsError(null)
      setLocalData({
        ...localData,
        params: parsed,
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

  const nodeType = node?.type
  const canAddEdge = edgeInput.trim().length > 0 && !triggerEdges.includes(edgeInput.trim())
  const handleAddEdge = () => {
    if (!canAddEdge) return
    const nextEdges = [...triggerEdges, edgeInput.trim()]
    setLocalData({ ...localData, edges: nextEdges })
    setEdgeInput('')
  }
  const handleRemoveEdge = (edge: string) => {
    setLocalData({ ...localData, edges: triggerEdges.filter((e: string) => e !== edge) })
  }

  return (
    <>
      <Sheet open={!!node} onOpenChange={(open) => !open && handleSheetClose()}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
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
              {nodeType === 'trigger' && (
                <>
                  <div className="space-y-2">
                    <Label>Operation</Label>
                    <Select value={localData.operation} onValueChange={(val) => setLocalData({ ...localData, operation: val })}>
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
                    <Select value={localData.objectType} onValueChange={(val) => setLocalData({ ...localData, objectType: val })}>
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
                    {localData.objectType && objectTypes.find((t) => t.type === localData.objectType)?.eligibleFields.length ? (
                      <div className="space-y-2 border rounded-md p-2 max-h-48 overflow-auto">
                        {objectTypes
                          .find((t) => t.type === localData.objectType)
                          ?.eligibleFields.map((field) => (
                            <div key={field.name} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`edit-field-${field.name}`}
                                checked={localData.fields?.includes(field.name) || false}
                                onChange={(e) => {
                                  const currentFields = localData.fields || []
                                  const newFields = e.target.checked ? [...currentFields, field.name] : currentFields.filter((f: string) => f !== field.name)
                                  setLocalData({ ...localData, fields: newFields })
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
                        {triggerEdges.map((edge: string) => (
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
                    <Input value={localData.description || ''} onChange={(e) => setLocalData({ ...localData, description: e.target.value })} placeholder="When to trigger" />
                  </div>

                  <div className="space-y-2">
                    <CELConditionBuilder
                      objectType={localData.objectType}
                      objectTypes={objectTypes}
                      initialExpression={localData.expression || 'true'}
                      onChange={(expr) => setLocalData({ ...localData, expression: expr })}
                    />
                  </div>
                </>
              )}

              {nodeType === 'condition' && (
                <>
                  <div className="space-y-2">
                    <CELConditionBuilder objectTypes={objectTypes} initialExpression={localData.expression || 'true'} onChange={(expr) => setLocalData({ ...localData, expression: expr })} />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={localData.description || ''} onChange={(e) => setLocalData({ ...localData, description: e.target.value })} placeholder="Explain this condition" />
                  </div>
                </>
              )}

              {nodeType === 'action' && (
                <>
                  <div className="space-y-2">
                    <Label>Action Key</Label>
                    <Input value={localData.key || ''} onChange={(e) => setLocalData({ ...localData, key: e.target.value })} placeholder="approval" />
                  </div>

                  <div className="space-y-2">
                    <Label>Action Type</Label>
                    <Select value={localData.type} onValueChange={(val) => setLocalData({ ...localData, type: val })}>
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
                    <Input value={localData.description || ''} onChange={(e) => setLocalData({ ...localData, description: e.target.value })} placeholder="What this action does" />
                  </div>

                  {(localData.type === 'REQUEST_APPROVAL' || localData.type === 'REQUEST_REVIEW') && (
                    <>
                      <div className="space-y-2">
                        <Label>{localData.type === 'REQUEST_REVIEW' ? 'Review label' : 'Approval label'}</Label>
                        <Input
                          value={localData.params?.label || ''}
                          onChange={(e) =>
                            setLocalData({
                              ...localData,
                              params: { ...(localData.params ?? {}), label: e.target.value },
                            })
                          }
                          placeholder="Approval label"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Required for completion</Label>
                        <Switch
                          checked={localData.params?.required ?? true}
                          onCheckedChange={(checked) =>
                            setLocalData({
                              ...localData,
                              params: { ...(localData.params ?? {}), required: checked },
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>{localData.type === 'REQUEST_REVIEW' ? 'Required reviews' : 'Required approvals'}</Label>
                        <Input
                          type="number"
                          min="0"
                          value={localData.params?.required_count ?? 1}
                          onChange={(e) =>
                            setLocalData({
                              ...localData,
                              params: { ...(localData.params ?? {}), required_count: parseInt(e.target.value, 10) || 0 },
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground">Use 0 to require all targets.</p>
                      </div>

                      <TargetSelector targets={targets} onAdd={handleAddTarget} onRemove={handleRemoveTarget} resolverKeys={resolverKeys} getTargetLabel={getTargetLabel} />
                    </>
                  )}

                  {localData.type !== 'REQUEST_APPROVAL' && localData.type !== 'REQUEST_REVIEW' && (
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
