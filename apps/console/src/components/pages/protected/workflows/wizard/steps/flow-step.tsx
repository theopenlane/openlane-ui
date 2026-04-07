import { Card, CardContent } from '@repo/ui/cardpanel'
import { ArrowRight, Layers, Wrench, Zap } from 'lucide-react'
import { toHumanLabel } from '@/utils/strings'
import { TRIGGER_OPERATION_OPTIONS } from '@/lib/workflow-templates'
import { GOAL_OPTIONS } from '../constants'
import type { WizardState } from '../hooks/use-wizard-state'

type FlowStepProps = {
  state: WizardState
  isLoadingMetadata: boolean
}

export const FlowStep = ({ state, isLoadingMetadata }: FlowStepProps) => {
  return (
    <Card>
      <CardContent>
        {isLoadingMetadata ? (
          <p className="text-sm text-muted-foreground">Loading workflow metadata...</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_auto_1fr] gap-2 items-stretch">
              <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 flex h-full min-h-[84px] items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md border bg-background">
                  <Layers className="h-4 w-4 text-sky-600" />
                </span>
                <div>
                  <p className="text-sm font-medium">What object should this apply to?</p>
                  <p className="text-xs text-muted-foreground">Pick the object type the workflow will operate on</p>
                </div>
              </div>
              <div className="hidden lg:flex items-center justify-center text-muted-foreground self-center">
                <ArrowRight className="h-4 w-4" />
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 flex h-full min-h-[84px] items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md border bg-background">
                  <Zap className="h-4 w-4 text-emerald-600" />
                </span>
                <div>
                  <p className="text-sm font-medium">What triggers it to run?</p>
                  <p className="text-xs text-muted-foreground">Choose a create, update, or delete event.</p>
                </div>
              </div>
              <div className="hidden lg:flex items-center justify-center text-muted-foreground self-center">
                <ArrowRight className="h-4 w-4" />
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 flex h-full min-h-[84px] items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md border bg-background">
                  <Wrench className="h-4 w-4 text-amber-600" />
                </span>
                <div>
                  <p className="text-sm font-medium">What action should be taken?</p>
                  <p className="text-xs text-muted-foreground">Route approvals, notify, or call a webhook.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="rounded-lg border border-border/60 p-3 bg-muted/10">
                <div className="space-y-2">
                  {state.sortedObjectTypes.map((obj) => {
                    const selected = state.schemaType === obj.type
                    return (
                      <button
                        key={obj.type}
                        type="button"
                        onClick={() => {
                          if (state.schemaType === obj.type) {
                            state.setSchemaType('')
                            state.setOperationPicked(false)
                            state.setActionType(null)
                            return
                          }
                          state.setSchemaType(obj.type)
                        }}
                        className={`w-full text-left rounded-md border px-3 py-2 transition ${selected ? 'border-primary bg-muted/20' : 'border-border hover:border-primary/60'}`}
                      >
                        <p className="text-sm font-medium">{toHumanLabel(obj.label) || toHumanLabel(obj.type)}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className={`rounded-lg border border-border/60 p-3 transition bg-muted/10 ${state.schemaType ? '' : 'opacity-60'}`}>
                <div className="space-y-2">
                  {TRIGGER_OPERATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        if (!state.schemaType) return
                        if (state.operationPicked && state.operation === opt.value) {
                          state.setOperationPicked(false)
                          return
                        }
                        state.setOperation(opt.value as 'CREATE' | 'UPDATE' | 'DELETE')
                        state.setOperationPicked(true)
                      }}
                      disabled={!state.schemaType}
                      className={`w-full text-left rounded-md border px-3 py-2 transition ${state.operationPicked && state.operation === opt.value ? 'border-primary bg-muted/20' : 'border-border hover:border-primary/60'} ${!state.schemaType ? 'cursor-not-allowed' : ''}`}
                    >
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {opt.value === 'CREATE' && 'Runs when a new record is created.'}
                        {opt.value === 'UPDATE' && 'Runs when tracked fields or edges change.'}
                        {opt.value === 'DELETE' && 'Runs when a record is removed.'}
                      </p>
                    </button>
                  ))}
                </div>
                {!state.schemaType && <div className="mt-3" />}
              </div>

              <div className={`rounded-lg border border-border/60 p-3 transition bg-muted/10 ${state.schemaType && state.operationPicked ? '' : 'opacity-60'}`}>
                <div className="space-y-2">
                  {GOAL_OPTIONS.map((option) => {
                    const selected = state.actionType === option.actionType
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          if (!state.schemaType || !state.operationPicked) return
                          if (state.actionType === option.actionType) {
                            state.setActionType(null)
                            return
                          }
                          state.handleSelectGoal(option)
                        }}
                        disabled={!state.schemaType || !state.operationPicked}
                        className={`w-full text-left rounded-md border px-3 py-2 transition ${state.schemaType && state.operationPicked && selected ? 'border-primary bg-muted/20' : 'border-border hover:border-primary/60'} ${!state.schemaType || !state.operationPicked ? 'cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-md border bg-secondary">{option.icon}</span>
                          <div>
                            <p className="text-sm font-medium">{option.label}</p>
                            <p className="text-xs text-muted-foreground">{option.description}</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
                {!state.schemaType && <div className="mt-3" />}
                {state.schemaType && !state.operationPicked && <div className="mt-3" />}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
