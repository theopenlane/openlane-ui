'use client'

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
import type { Target } from '@/components/pages/protected/workflows/types'

const ACTION_TYPE_OPTIONS = [
  { label: 'Request Approval', value: 'REQUEST_APPROVAL' },
  { label: 'Review', value: 'REQUEST_REVIEW' },
  { label: 'Notify', value: 'NOTIFY' },
  { label: 'Webhook', value: 'WEBHOOK' },
  { label: 'Field Update', value: 'UPDATE_FIELD' },
]

const WEBHOOK_METHOD_OPTIONS = ['POST', 'PUT', 'PATCH', 'GET']

type ActionFormSectionProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actions: any[]
  eligibleFields: { name: string; label: string; type: string }[]
  resolverKeys: string[]
  userOptions: { label: string; value: string }[]
  groupOptions: { label: string; value: string }[]
  isLoadingUsers: boolean
  isLoadingGroups: boolean
  actionParamsDrafts: Record<number, { value: string; error?: string }>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getApprovalTargets: (action: any) => Target[]
  onAddAction: () => void
  onRemoveAction: (index: number) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdateAction: (index: number, field: string, value: any) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdateActionParam: (index: number, paramField: string, value: any) => void
  onActionParamsChange: (index: number, value: string) => void
  onWebhookPayloadTextUpdate: (index: number, value: string) => void
  onAddTarget: (index: number, target: Target) => void
  onRemoveTarget: (index: number, target: Target) => void
}

export const ActionFormSection = ({
  actions,
  eligibleFields,
  resolverKeys,
  userOptions,
  groupOptions,
  isLoadingUsers,
  isLoadingGroups,
  actionParamsDrafts,
  getApprovalTargets,
  onAddAction,
  onRemoveAction,
  onUpdateAction,
  onUpdateActionParam,
  onActionParamsChange,
  onWebhookPayloadTextUpdate,
  onAddTarget,
  onRemoveTarget,
}: ActionFormSectionProps) => {
  return (
    <Card className="border border-muted-foreground/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Define what happens when the workflow executes.</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={onAddAction}>
            <Plus className="h-4 w-4 mr-1" />
            Add action
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {actions.map((action, index) => {
          const isApproval = action.type === 'REQUEST_APPROVAL'
          const isReview = action.type === 'REQUEST_REVIEW'
          const isApprovalLike = isApproval || isReview
          const isWebhook = action.type === 'WEBHOOK'
          const targets = getApprovalTargets(action)
          const selectedUsers = targets.filter((t) => t.type === 'USER' && t.id)
          const selectedGroups = targets.filter((t) => t.type === 'GROUP' && t.id)
          const selectedResolvers = targets.filter((t) => t.type === 'RESOLVER' && t.resolver_key).map((t) => t.resolver_key as string)
          const paramsDraft = actionParamsDrafts[index]
          const webhookPayloadText = action.params?.payload && typeof action.params.payload === 'object' && !Array.isArray(action.params.payload) ? action.params.payload.text || '' : ''
          return (
            <Card key={`action-${index}`} className="border-dashed">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Action {index + 1}</CardTitle>
                  {actions.length > 1 && (
                    <Button size="sm" variant="transparent" onClick={() => onRemoveAction(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Action key *</Label>
                    <Input value={action.key} onChange={(e) => onUpdateAction(index, 'key', e.target.value)} placeholder="approval" />
                  </div>

                  <div className="space-y-2">
                    <Label>Action type *</Label>
                    <Select value={action.type} onValueChange={(val) => onUpdateAction(index, 'type', val)}>
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
                  <Input value={action.description} onChange={(e) => onUpdateAction(index, 'description', e.target.value)} placeholder="What this action does" />
                </div>

                <div className="space-y-2">
                  <Label>When (optional)</Label>
                  <Input value={action.when || ''} onChange={(e) => onUpdateAction(index, 'when', e.target.value)} placeholder="assignments.approved >= 1" />
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
                          onChange={(e) => onUpdateActionParam(index, 'label', e.target.value)}
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
                                      const newFields = e.target.checked ? [...currentFields, field.name] : currentFields.filter((f: string) => f !== field.name)
                                      onUpdateActionParam(index, 'fields', newFields)
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
                            <p className="text-sm text-muted-foreground border rounded-md p-3">No workflow-eligible fields available for this object type.</p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <Label>Required for completion</Label>
                        <Switch checked={action.params?.required ?? true} onCheckedChange={(checked) => onUpdateActionParam(index, 'required', checked)} />
                      </div>

                      <div className="space-y-2">
                        <Label>{isReview ? 'Required reviews' : 'Required approvals'}</Label>
                        <Input type="number" min="0" value={action.params?.required_count ?? 1} onChange={(e) => onUpdateActionParam(index, 'required_count', parseInt(e.target.value, 10) || 0)} />
                        <p className="text-xs text-muted-foreground">Use 0 to require all targets.</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Assign to Users</Label>
                        <Select onValueChange={(val) => onAddTarget(index, { type: 'USER', id: val })} value="">
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
                                <X className="h-3 w-3 cursor-pointer" onClick={() => onRemoveTarget(index, { type: 'USER', id: user.id })} />
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Assign to Groups</Label>
                        <Select onValueChange={(val) => onAddTarget(index, { type: 'GROUP', id: val })} value="">
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
                                <X className="h-3 w-3 cursor-pointer" onClick={() => onRemoveTarget(index, { type: 'GROUP', id: group.id })} />
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {resolverKeys.length > 0 && (
                        <div className="space-y-2">
                          <Label>Assign via Resolver</Label>
                          <Select onValueChange={(val) => onAddTarget(index, { type: 'RESOLVER', resolver_key: val })} value="">
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
                                  <X className="h-3 w-3 cursor-pointer" onClick={() => onRemoveTarget(index, { type: 'RESOLVER', resolver_key: resolverKey })} />
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
                      <Input value={action.params?.url || ''} onChange={(e) => onUpdateActionParam(index, 'url', e.target.value)} placeholder="https://hooks.slack.com/..." />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Method</Label>
                        <Select value={action.params?.method || 'POST'} onValueChange={(val) => onUpdateActionParam(index, 'method', val)}>
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
                        <Input type="number" min="0" value={action.params?.timeout_ms ?? 5000} onChange={(e) => onUpdateActionParam(index, 'timeout_ms', Number(e.target.value) || 0)} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Message template</Label>
                      <Textarea
                        value={webhookPayloadText}
                        onChange={(e) => onWebhookPayloadTextUpdate(index, e.target.value)}
                        placeholder="Control status approved. Control details are included in the payload."
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground">
                        Templates can reference workflow variables (e.g. <span>{'{{ object_id }}'}</span>).
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Action Parameters (JSON)</Label>
                    <Textarea
                      value={paramsDraft?.value ?? JSON.stringify(action.params ?? {}, null, 2)}
                      onChange={(e) => onActionParamsChange(index, e.target.value)}
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
  )
}
