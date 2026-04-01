'use client'

import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Textarea } from '@repo/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Badge } from '@repo/ui/badge'
import { Switch } from '@repo/ui/switch'
import { TRIGGER_OPERATION_OPTIONS } from '@/lib/workflow-templates'
import type { WorkflowObjectTypeMetadata } from '@/lib/graphql-hooks/workflows'
import { useUserSelect } from '@/lib/graphql-hooks/member'
import { useGroupSelect } from '@/lib/graphql-hooks/group'
import { CELConditionBuilder } from '@/components/workflows/cel-condition-builder'
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

export const NodeEditPanel = ({ node, objectTypes, onClose, onUpdate, onDelete }: NodeEditPanelProps) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [localData, setLocalData] = useState<any>(null)
  const [paramsInput, setParamsInput] = useState('')
  const [paramsError, setParamsError] = useState<string | null>(null)
  const [edgeInput, setEdgeInput] = useState('')

  const { userOptions, isLoading: isLoadingUsers } = useUserSelect({})
  const { groupOptions, isLoading: isLoadingGroups } = useGroupSelect()

  useEffect(() => {
    if (node) {
      const nextData = { ...node.data }
      if (node.type === 'action') {
        const params = { ...(nextData.params ?? {}) }
        params.targets = normalizeTargets(params)
        nextData.params = params
      }
      setLocalData(nextData)
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

  const selectedUsers = useMemo(() => {
    const userIds = targets.filter((t) => t.type === 'USER' && t.id).map((t) => t.id as string)
    return userOptions.filter((u) => userIds.includes(u.value))
  }, [targets, userOptions])

  const selectedGroups = useMemo(() => {
    const groupIds = targets.filter((t) => t.type === 'GROUP' && t.id).map((t) => t.id as string)
    return groupOptions.filter((g) => groupIds.includes(g.value))
  }, [targets, groupOptions])

  const selectedResolvers = useMemo(() => {
    return targets.filter((t) => t.type === 'RESOLVER' && t.resolver_key).map((t) => t.resolver_key as string)
  }, [targets])

  const updateTargets = (nextTargets: Target[]) => {
    setLocalData({
      ...localData,
      params: {
        ...(localData.params ?? {}),
        targets: nextTargets,
      },
    })
  }

  const handleAddUser = (userId: string) => {
    if (!userId) return
    const existing = targets.some((target) => target.type === 'USER' && target.id === userId)
    if (existing) return
    updateTargets([...targets, { type: 'USER', id: userId }])
  }

  const handleRemoveUser = (userId: string) => {
    updateTargets(targets.filter((target) => !(target.type === 'USER' && target.id === userId)))
  }

  const handleAddGroup = (groupId: string) => {
    if (!groupId) return
    const existing = targets.some((target) => target.type === 'GROUP' && target.id === groupId)
    if (existing) return
    updateTargets([...targets, { type: 'GROUP', id: groupId }])
  }

  const handleRemoveGroup = (groupId: string) => {
    updateTargets(targets.filter((target) => !(target.type === 'GROUP' && target.id === groupId)))
  }

  const handleAddResolver = (resolverKey: string) => {
    if (!resolverKey) return
    const existing = targets.some((target) => target.type === 'RESOLVER' && target.resolver_key === resolverKey)
    if (existing) return
    updateTargets([...targets, { type: 'RESOLVER', resolver_key: resolverKey }])
  }

  const handleRemoveResolver = (resolverKey: string) => {
    updateTargets(targets.filter((target) => !(target.type === 'RESOLVER' && target.resolver_key === resolverKey)))
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
    <Sheet open={!!node} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            Edit {nodeType?.charAt(0).toUpperCase()}
            {nodeType?.slice(1)}
          </SheetTitle>
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
                              {edge}
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
                          {edge}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveEdge(edge)} />
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

                    <div className="space-y-2">
                      <Label>Assign to Users</Label>
                      <Select onValueChange={handleAddUser} value="">
                        <SelectTrigger disabled={isLoadingUsers}>
                          <SelectValue placeholder={isLoadingUsers ? 'Loading users...' : 'Select user...'} />
                        </SelectTrigger>
                        <SelectContent>
                          {userOptions
                            .filter((u) => !selectedUsers.find((s) => s.value === u.value))
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
                            <Badge key={user.value} variant="secondary" className="gap-1">
                              {user.label}
                              <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveUser(user.value)} />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Assign to Groups</Label>
                      <Select onValueChange={handleAddGroup} value="">
                        <SelectTrigger disabled={isLoadingGroups}>
                          <SelectValue placeholder={isLoadingGroups ? 'Loading groups...' : 'Select group...'} />
                        </SelectTrigger>
                        <SelectContent>
                          {groupOptions
                            .filter((g) => !selectedGroups.find((s) => s.value === g.value))
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
                            <Badge key={group.value} variant="secondary" className="gap-1">
                              {group.label}
                              <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveGroup(group.value)} />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {resolverKeys.length > 0 && (
                      <div className="space-y-2">
                        <Label>Assign via Resolver</Label>
                        <Select onValueChange={handleAddResolver} value="">
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
                                <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveResolver(resolverKey)} />
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
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

            <div className="flex gap-2 pt-4 pb-4">
              <Button onClick={handleSave} className="flex-1" disabled={Boolean(paramsError)}>
                Save
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
