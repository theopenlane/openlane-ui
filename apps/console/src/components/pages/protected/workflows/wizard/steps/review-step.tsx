import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/cardpanel'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Badge } from '@repo/ui/badge'
import { Switch } from '@repo/ui/switch'
import { Textarea } from '@repo/ui/textarea'
import { toHumanLabel } from '@/utils/strings'
import { ACTION_LABELS } from '../../types'
import { buildTargetKey } from '../utils'
import type { WizardState } from '../hooks/use-wizard-state'

type ReviewStepProps = {
  state: WizardState
}

export const ReviewStep = ({ state }: ReviewStepProps) => {
  return (
    <div className="space-y-2">
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="p-0">Review & create</CardTitle>
          <CardDescription>Give the workflow a name and confirm the details.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={state.name} onChange={(e) => state.setName(e.target.value)} placeholder={state.suggestedName || 'Workflow name'} />
                {!state.name && state.suggestedName && <p className="text-xs text-muted-foreground">Suggested: {state.suggestedName}</p>}
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={state.description} onChange={(e) => state.setDescription(e.target.value)} rows={3} placeholder="Describe what this workflow does" />
              </div>

              <div className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active</span>
                  <Switch checked={state.active} onCheckedChange={state.setActive} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Draft</span>
                  <Switch checked={state.draft} onCheckedChange={state.setDraft} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Default for schema</span>
                  <Switch checked={state.isDefault} onCheckedChange={state.setIsDefault} />
                </div>
                <div className="space-y-2">
                  <Label>Cooldown (seconds)</Label>
                  <Input type="number" min="0" value={state.cooldownSeconds} onChange={(e) => state.setCooldownSeconds(Number(e.target.value) || 0)} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-border p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Goal</p>
                  <p className="font-medium">{state.actionType ? ACTION_LABELS[state.actionType] : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Object</p>
                  <p className="font-medium">{toHumanLabel(state.objectLabel) || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Trigger</p>
                  <p className="font-medium">
                    {state.operationLabel || state.operation || '—'} {state.fieldScope === 'specific' && state.trackedFields.length > 0 ? `(${state.trackedFields.join(', ')})` : ''}
                  </p>
                  {state.edges.length > 0 && <p className="text-sm text-muted-foreground">Edges: {state.edges.join(', ')}</p>}
                </div>
                {state.conditionExpressionFinal && (
                  <div>
                    <p className="text-xs text-muted-foreground">Condition</p>
                    <p className="text-sm">{state.conditionExpressionFinal}</p>
                  </div>
                )}
                {state.targets.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">Targets</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {state.targets.map((target) => (
                        <Badge key={buildTargetKey(target)} variant="secondary">
                          {state.getTargetLabel(target)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Definition preview</Label>
                <Textarea readOnly value={JSON.stringify(state.workflowPreview, null, 2)} className="font-mono text-xs" rows={12} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
