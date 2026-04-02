import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/cardpanel'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Checkbox } from '@repo/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Textarea } from '@repo/ui/textarea'
import { toHumanLabel } from '@/utils/strings'
import { WizardActionType, WEBHOOK_METHOD_OPTIONS } from '../../types'
import { FlowSummary } from '../components/flow-summary'
import { TargetSelector } from '../components/target-selector'
import type { ApprovalTiming } from '../types'
import type { WizardState } from '../hooks/use-wizard-state'

type ConfigureStepProps = {
  state: WizardState
}

export const ConfigureStep = ({ state }: ConfigureStepProps) => {
  const currentStepError = state.getValidationError('configure')

  return (
    <Card>
      <CardHeader>
        <CardTitle>{state.selectedActionLabel ? `Configure ${state.selectedActionLabel.toLowerCase()}` : 'Configure the action'}</CardTitle>
        <CardDescription>Choose recipients and fill out the action details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FlowSummary objectLabel={toHumanLabel(state.objectLabel)} operationLabel={state.operationLabel || '—'} actionLabel={state.selectedActionLabel || '—'} />

        {(state.actionType === WizardActionType.REQUEST_APPROVAL || state.actionType === WizardActionType.REQUEST_REVIEW) && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                {state.actionType === WizardActionType.REQUEST_REVIEW ? 'Reviewers' : 'Approvers'} <span className="text-destructive">*</span>
              </Label>
              <TargetSelector
                targets={state.targets}
                onAdd={state.addTarget}
                onRemove={state.removeTarget}
                resolverKeys={state.resolverKeys}
                getTargetLabel={state.getTargetLabel}
                error={currentStepError}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{state.actionType === WizardActionType.REQUEST_REVIEW ? 'Review label' : 'Approval label'}</Label>
                <Input
                  value={state.approvalLabel}
                  onChange={(e) => state.setApprovalLabel(e.target.value)}
                  placeholder={state.actionType === WizardActionType.REQUEST_REVIEW ? 'e.g. Control change review' : 'e.g. Control change approval'}
                />
              </div>
              <div className="space-y-2">
                <Label>{state.actionType === WizardActionType.REQUEST_REVIEW ? 'Required reviews' : 'Required approvals'}</Label>
                <Input type="number" min="1" value={state.requiredCount} onChange={(e) => state.setRequiredCount(Number(e.target.value) || 1)} />
              </div>
            </div>
            {state.actionType === WizardActionType.REQUEST_APPROVAL && (
              <div className="space-y-2">
                <Label>Approval timing</Label>
                <Select value={state.approvalTiming} onValueChange={(val) => state.setApprovalTiming(val as ApprovalTiming)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRE_COMMIT">Pre-commit (blocks change until approved)</SelectItem>
                    <SelectItem value="POST_COMMIT">Post-commit (approval occurs after change)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Pre-commit approvals gate the change. Post-commit approvals review after changes apply.</p>
              </div>
            )}
            {state.actionType === WizardActionType.REQUEST_APPROVAL && state.trackedFields.length > 0 && (
              <div className="text-sm text-muted-foreground">Fields gated by approval: {state.trackedFields.join(', ')}</div>
            )}
          </div>
        )}

        {state.actionType === WizardActionType.NOTIFY && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                Recipients <span className="text-destructive">*</span>
              </Label>
              <TargetSelector
                targets={state.targets}
                onAdd={state.addTarget}
                onRemove={state.removeTarget}
                resolverKeys={state.resolverKeys}
                getTargetLabel={state.getTargetLabel}
                error={currentStepError}
              />
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={state.notificationTitle} onChange={(e) => state.setNotificationTitle(e.target.value)} placeholder="Notification title" />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={state.notificationBody} onChange={(e) => state.setNotificationBody(e.target.value)} rows={3} placeholder="Describe the notification" />
            </div>
            <div className="space-y-2">
              <Label>Channels</Label>
              <div className="flex flex-wrap gap-3">
                {['IN_APP', 'EMAIL', 'SLACK'].map((channel) => (
                  <label key={channel} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={state.notificationChannels.includes(channel)} onCheckedChange={(checked) => state.toggleChannel(channel, Boolean(checked))} />
                    <span>{channel.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {state.actionType === WizardActionType.WEBHOOK && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Webhook URL <span className="text-destructive">*</span>
                </Label>
                <Input value={state.webhookUrl} onChange={(e) => state.setWebhookUrl(e.target.value)} placeholder="https://" />
              </div>
              <div className="space-y-2">
                <Label>Method</Label>
                <Select value={state.webhookMethod} onValueChange={state.setWebhookMethod}>
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
              <Textarea value={state.webhookPayload} onChange={(e) => state.setWebhookPayload(e.target.value)} rows={3} placeholder='{"text": "Workflow triggered for " + object.name}' />
              <p className="text-xs text-muted-foreground">CEL expression that evaluates to a JSON object merged into the base payload. Leave empty for default payload.</p>
            </div>
          </div>
        )}

        {state.actionType === WizardActionType.UPDATE_FIELD && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                Field <span className="text-destructive">*</span>
              </Label>
              {state.eligibleFields.length > 0 ? (
                <Select value={state.fieldUpdateField} onValueChange={state.setFieldUpdateField}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a field" />
                  </SelectTrigger>
                  <SelectContent>
                    {state.eligibleFields.map((field) => (
                      <SelectItem key={field.name} value={field.name}>
                        {field.label || field.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={state.fieldUpdateField} onChange={(e) => state.setFieldUpdateField(e.target.value)} placeholder="Field name" />
              )}
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              <Input value={state.fieldUpdateValue} onChange={(e) => state.setFieldUpdateValue(e.target.value)} placeholder="New value" />
            </div>
          </div>
        )}

        {!state.actionType && <p className="text-sm text-muted-foreground">Choose a goal to configure the action.</p>}
        {currentStepError && state.actionType !== WizardActionType.REQUEST_APPROVAL && state.actionType !== WizardActionType.REQUEST_REVIEW && state.actionType !== WizardActionType.NOTIFY && (
          <p className="text-sm text-destructive">{currentStepError}</p>
        )}
      </CardContent>
    </Card>
  )
}
