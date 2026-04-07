import { Button } from '@repo/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/cardpanel'
import { Checkbox } from '@repo/ui/checkbox'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Badge } from '@repo/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Switch } from '@repo/ui/switch'
import { Textarea } from '@repo/ui/textarea'
import { X } from 'lucide-react'
import { toHumanLabel } from '@/utils/strings'
import { ACTION_LABELS } from '../../types'
import { FlowSummary } from '../components/flow-summary'
import { useEffect } from 'react'
import { WizardActionType } from '../../types'
import type { WizardState } from '../hooks/use-wizard-state'

type RulesStepProps = {
  state: WizardState
}

export const RulesStep = ({ state }: RulesStepProps) => {
  const { fieldScope, setFieldScope } = state
  const requiresSpecificFields = state.actionType === WizardActionType.REQUEST_APPROVAL && state.operation === 'UPDATE'

  useEffect(() => {
    if (requiresSpecificFields && fieldScope === 'any') {
      setFieldScope('specific')
    }
  }, [requiresSpecificFields, fieldScope, setFieldScope])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="p-0">Refine the trigger</CardTitle>
          <CardDescription>Fine-tune fields, edges, and optional conditions for the selected flow.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FlowSummary objectLabel={toHumanLabel(state.objectLabel)} operationLabel={state.operationLabel || '—'} actionLabel={state.actionType ? ACTION_LABELS[state.actionType] : '—'} />

          {state.operation === 'UPDATE' ? (
            <div className="space-y-4 rounded-lg border border-border/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Label>Tracked fields</Label>
                  <p className="text-xs text-muted-foreground">Select which field changes should trigger this workflow.</p>
                </div>
                <div className="flex flex-col gap-1">
                  <div className={`flex w-fit self-end items-center gap-3 rounded-full border border-border/60 bg-muted/10 px-3 py-2 ${requiresSpecificFields ? 'cursor-not-allowed opacity-70' : ''}`}>
                    <span className={`text-xs ${state.fieldScope === 'any' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>Any field</span>
                    <Switch checked={state.fieldScope === 'specific'} disabled={requiresSpecificFields} onCheckedChange={(checked) => state.setFieldScope(checked ? 'specific' : 'any')} />
                    <span className={`text-xs ${state.fieldScope === 'specific' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>Specific fields</span>
                  </div>
                  {requiresSpecificFields && <p className="text-xs text-muted-foreground">Approval workflows require specific fields to be selected.</p>}
                </div>
              </div>
              {state.fieldScope === 'any' ? (
                <div className="rounded-md border border-border/60 bg-muted/10 px-3 py-3 text-sm text-muted-foreground">
                  Any update on {toHumanLabel(state.objectLabel)} will trigger this workflow.
                </div>
              ) : state.eligibleFields.length === 0 ? (
                <div className="rounded-md border border-border/60 bg-muted/10 px-3 py-3 text-sm text-muted-foreground">No eligible fields are available for this object.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {state.eligibleFields.map((field) => {
                    const checked = state.trackedFields.includes(field.name)
                    return (
                      <label
                        key={field.name}
                        className={`flex items-start gap-3 rounded-md border px-3 py-2 transition ${checked ? 'border-primary bg-primary/5' : 'border-border/60 bg-background hover:border-primary/60'}`}
                      >
                        <Checkbox checked={checked} onCheckedChange={(value) => state.toggleTrackedField(field.name, Boolean(value))} />
                        <div>
                          <p className="text-sm font-medium">{field.label || field.name}</p>
                          {field.label && field.label !== field.name && <p className="text-xs text-muted-foreground">{field.name}</p>}
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground">
              Tracked fields apply to update triggers. Your workflow runs on <span className="font-medium text-foreground">{state.operationLabel || state.operation}</span>.
            </div>
          )}

          <div className="space-y-3 rounded-lg border border-border/60 p-4">
            <div>
              <Label>Edge changes (optional)</Label>
              <p className="text-xs text-muted-foreground">Trigger when relationships like evidence or owners change.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {state.hasEdgeOptions ? (
                <Select value={state.edgeSelect} onValueChange={state.setEdgeSelect}>
                  <SelectTrigger className="flex-1 min-w-55">
                    <SelectValue placeholder="Select an edge" />
                  </SelectTrigger>
                  <SelectContent>
                    {state.edgeOptions.map((edge) => (
                      <SelectItem key={edge} value={edge}>
                        {edge}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={state.edgeInput} onChange={(e) => state.setEdgeInput(e.target.value)} placeholder="e.g., evidence, owner" className="flex-1 min-w-50" />
              )}
              <Button type="button" variant="outline" onClick={state.addEdge} disabled={state.hasEdgeOptions ? !state.edgeSelect : !state.edgeInput.trim()}>
                Add edge
              </Button>
            </div>
            {!state.hasEdgeOptions && <p className="text-xs text-muted-foreground">No edge suggestions yet. Add one manually.</p>}
            {state.edges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {state.edges.map((edge) => (
                  <Badge key={edge} variant="secondary" className="flex items-center gap-1">
                    {edge}
                    <button type="button" onClick={() => state.removeEdge(edge)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-lg border border-border/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Condition (optional)</Label>
                <p className="text-xs text-muted-foreground">Only run when this expression matches.</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={state.conditionEnabled} onCheckedChange={state.setConditionEnabled} />
                <span className="text-sm text-muted-foreground">Only when</span>
              </div>
            </div>

            {state.conditionEnabled && !state.conditionUseCel && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Select value={state.conditionField} onValueChange={state.setConditionField}>
                  <SelectTrigger>
                    <SelectValue placeholder="Field" />
                  </SelectTrigger>
                  <SelectContent>
                    {state.eligibleFields.map((field) => (
                      <SelectItem key={field.name} value={field.name}>
                        {field.label || field.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={state.conditionOperator} onValueChange={(val) => state.setConditionOperator(val as 'eq' | 'neq')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Operator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eq">is</SelectItem>
                    <SelectItem value="neq">is not</SelectItem>
                  </SelectContent>
                </Select>

                <Input value={state.conditionValue} onChange={(e) => state.setConditionValue(e.target.value)} placeholder="Value" />
              </div>
            )}

            {state.conditionEnabled && state.conditionUseCel && (
              <Textarea value={state.conditionExpression} onChange={(e) => state.setConditionExpression(e.target.value)} rows={3} placeholder="e.g. object.status == 'PUBLISHED'" />
            )}

            {state.conditionEnabled && (
              <Button type="button" variant="transparent" onClick={() => state.setConditionUseCel((prev) => !prev)}>
                {state.conditionUseCel ? 'Use simple builder' : 'Use CEL expression'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
