'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/cardpanel'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Textarea } from '@repo/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Switch } from '@repo/ui/switch'
import { Separator } from '@repo/ui/separator'
import { TargetSelector } from '@/components/pages/protected/workflows/wizard/components/target-selector'
import { getTargetLabel } from '@/components/pages/protected/workflows/wizard/utils'
import type { Target, UpdateWorkflowAction, UpdateWorkflowActionParam, WebhookMethod, WorkflowAction, WorkflowActionType } from '@/types/workflow'

const ACTION_TYPE_OPTIONS: Array<{ label: string; value: WorkflowActionType }> = [
  { label: 'Request Approval', value: 'REQUEST_APPROVAL' },
  { label: 'Review', value: 'REQUEST_REVIEW' },
  { label: 'Notify', value: 'NOTIFY' },
  { label: 'Webhook', value: 'WEBHOOK' },
  { label: 'Field Update', value: 'UPDATE_FIELD' },
]

const WEBHOOK_METHOD_OPTIONS: WebhookMethod[] = ['POST', 'PUT', 'PATCH', 'GET']

type ActionFormSectionProps = {
  actions: WorkflowAction[]
  eligibleFields: { name: string; label: string; type: string }[]
  resolverKeys: string[]
  actionParamsDrafts: Record<number, { value: string; error?: string }>
  getApprovalTargets: (action: WorkflowAction) => Target[]
  onAddAction: () => void
  onRemoveAction: (index: number) => void
  onUpdateAction: UpdateWorkflowAction
  onUpdateActionParam: UpdateWorkflowActionParam
  onActionParamsChange: (index: number, value: string) => void
  onAddTarget: (index: number, target: Target) => void
  onRemoveTarget: (index: number, target: Target) => void
}

export const ActionFormSection = ({
  actions,
  eligibleFields,
  resolverKeys,
  actionParamsDrafts,
  getApprovalTargets,
  onAddAction,
  onRemoveAction,
  onUpdateAction,
  onUpdateActionParam,
  onActionParamsChange,
  onAddTarget,
  onRemoveTarget,
}: ActionFormSectionProps) => {
  return (
    <Card className="border border-muted-foreground/30">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="p-0">Actions</CardTitle>
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
          const paramsDraft = actionParamsDrafts[index]
          return (
            <Card key={`action-${index}`} className="border-dashed">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="p-0 text-sm">Action {index + 1}</CardTitle>
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
                    <Select value={action.type} onValueChange={(val) => onUpdateAction(index, 'type', val as WorkflowActionType)}>
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
                  <Input value={action.description ?? ''} onChange={(e) => onUpdateAction(index, 'description', e.target.value)} placeholder="What this action does" />
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
                                      const currentFields = action.params?.fields ?? []
                                      const newFields = e.target.checked ? [...currentFields, field.name] : currentFields.filter((currentField) => currentField !== field.name)
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

                      <TargetSelector
                        targets={targets}
                        onAdd={(target) => onAddTarget(index, target)}
                        onRemove={(target) => onRemoveTarget(index, target)}
                        resolverKeys={resolverKeys}
                        getTargetLabel={getTargetLabel}
                      />
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
                        <Select value={action.params?.method || 'POST'} onValueChange={(val) => onUpdateActionParam(index, 'method', val as WebhookMethod)}>
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
                      <Label>Payload expression (optional)</Label>
                      <Textarea
                        value={action.params?.payload_expr || ''}
                        onChange={(e) => onUpdateActionParam(index, 'payload_expr', e.target.value)}
                        placeholder='{"text": "Workflow triggered for " + object.name}'
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">CEL expression that evaluates to a JSON object merged into the base payload.</p>
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
