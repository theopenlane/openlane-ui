'use client'

import React, { useState } from 'react'
import { Button } from '@repo/ui/button'
import { cn } from '@repo/ui/lib/utils'
import { Calendar, CircleHelp, FileText, Mail, Repeat, Rocket, SendHorizontal, Users } from 'lucide-react'
import { formatDate } from '@/utils/date'
import { StepBadge } from '@/components/shared/step-badge/step-badge'
import { ModeOption } from '../shared/mode-option'
import { Callout } from '@/components/shared/callout/callout'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { type TCampaignQuestionnaire } from './campaign-questionnaire'

type CampaignContentMode = 'questionnaire' | 'email'

interface CampaignSetupViewProps {
  hasEmailTemplate: boolean
  emailTemplateLabel?: string
  questionnaire?: TCampaignQuestionnaire
  dueDate?: string | null
  recipientCount: number
  launchBlockedReason?: string
  recipientsSlot?: React.ReactNode
  isUpdating?: boolean
  isRecurring: boolean
  recurrenceLabel: string
  onEditRecurrence: () => void
  onEditDetails: () => void
  onChangeTemplate: () => void
  onRemoveTemplate: () => Promise<boolean>
  onConfigureQuestionnaire: () => void
  onRemoveQuestionnaire: () => Promise<boolean>
  onAddRecipients: () => void
  onSendTest: () => void
  onLaunch: () => void
}

export const CampaignSetupView: React.FC<CampaignSetupViewProps> = ({
  hasEmailTemplate,
  emailTemplateLabel,
  questionnaire,
  dueDate,
  recipientCount,
  launchBlockedReason,
  recipientsSlot,
  isUpdating,
  isRecurring,
  recurrenceLabel,
  onEditRecurrence,
  onEditDetails,
  onChangeTemplate,
  onRemoveTemplate,
  onConfigureQuestionnaire,
  onRemoveQuestionnaire,
  onAddRecipients,
  onSendTest,
  onLaunch,
}) => {
  const hasQuestionnaire = !!questionnaire
  const customizeEmailBlockedReason = hasQuestionnaire ? undefined : 'Select a questionnaire to customize its email.'
  const hasRecipients = recipientCount > 0

  const [pendingMode, setPendingMode] = useState<CampaignContentMode>('email')
  const mode: CampaignContentMode = hasQuestionnaire ? 'questionnaire' : hasEmailTemplate ? 'email' : pendingMode
  const hasContent = hasQuestionnaire || hasEmailTemplate

  const handleModeChange = async (nextMode: CampaignContentMode) => {
    if (nextMode === mode || isUpdating) return
    if (nextMode === 'questionnaire' && hasEmailTemplate && !(await onRemoveTemplate())) return
    if (nextMode === 'email' && hasQuestionnaire && !(await onRemoveQuestionnaire())) return
    setPendingMode(nextMode)
    if (nextMode === 'questionnaire' && !hasQuestionnaire) onConfigureQuestionnaire()
  }

  const contentStepHint = mode === 'questionnaire' ? (questionnaire?.name ?? 'Not set') : (emailTemplateLabel ?? 'Not set')

  const trackerSteps = [
    { label: 'Details', hint: 'Campaign information', done: true },
    { label: mode === 'questionnaire' ? 'Questionnaire' : 'Email template', hint: contentStepHint, done: hasContent },
    { label: 'Recipients', hint: 'Add or import recipients', done: hasRecipients },
    { label: 'Recurrence', hint: recurrenceLabel, done: isRecurring },
    { label: 'Send Test Email', hint: 'Preview and send a test email', done: false },
    { label: 'Launch', hint: 'Launch now or schedule', done: false },
  ]

  return (
    <div className="pr-4">
      <div className="mb-4 rounded-md border border-border bg-card p-4">
        <h3 className="text-base font-semibold">Campaign setup</h3>
        <p className="mb-6 text-sm text-muted-foreground">Complete these steps before launching your campaign.</p>

        <div className="flex items-start">
          {trackerSteps.map((step, index) => (
            <React.Fragment key={step.label}>
              <div className="flex w-24 shrink-0 flex-col items-center gap-1 text-center">
                <StepBadge done={step.done} stepNumber={index + 1} />
                <span className="text-xs font-medium">{step.label}</span>
                <span className="text-[11px] text-muted-foreground">{step.hint}</span>
              </div>
              {index < trackerSteps.length - 1 && <div className={cn('mt-4 h-0.5 flex-1', step.done ? 'bg-primary' : 'bg-border')} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <SetupCard icon={<FileText size={18} />} title="Details" subtitle="Campaign information" actionLabel="Edit details" onAction={onEditDetails} done />

        <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold">Campaign content</span>
            <span className="text-xs text-muted-foreground">A campaign uses either a questionnaire or an email template, not both.</span>
          </div>

          <div role="radiogroup" aria-label="Campaign content type" className="grid grid-cols-2 gap-3">
            <ModeOption
              icon={<CircleHelp size={18} />}
              title="Questionnaire"
              description="Recipients complete a questionnaire. Emails use the system template unless you customize them."
              selected={mode === 'questionnaire'}
              disabled={isUpdating}
              onSelect={() => handleModeChange('questionnaire')}
            />
            <ModeOption
              icon={<Mail size={18} />}
              title="Email template"
              description="Recipients receive the email template you choose."
              selected={mode === 'email'}
              disabled={isUpdating}
              onSelect={() => handleModeChange('email')}
            />
          </div>

          {!hasContent && (
            <Callout variant="warning" compact role="status">
              Select either a questionnaire or an email template before launching this campaign.
            </Callout>
          )}
        </div>

        {mode === 'questionnaire' ? (
          <>
            <SetupCard
              icon={<CircleHelp size={18} />}
              title="Questionnaire"
              subtitle={questionnaire?.name ?? 'No questionnaire selected'}
              actionLabel={hasQuestionnaire ? 'Change questionnaire' : 'Select questionnaire'}
              onAction={onConfigureQuestionnaire}
              secondaryAction={hasQuestionnaire ? { label: 'Remove', onAction: onRemoveQuestionnaire } : undefined}
              done={hasQuestionnaire}
              extra={
                questionnaire ? (
                  <div className="mt-1 flex flex-col gap-1 text-xs text-muted-foreground">
                    <span>{questionnaire.detail}</span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={12} /> Due date: {dueDate ? formatDate(dueDate) : 'Not set'}
                    </span>
                  </div>
                ) : undefined
              }
            />
            <SetupCard
              icon={<Mail size={18} />}
              title="Email template"
              subtitle={customizeEmailBlockedReason ?? emailTemplateLabel ?? 'System email'}
              actionLabel={hasEmailTemplate ? 'Change email' : 'Customize email'}
              onAction={onChangeTemplate}
              secondaryAction={hasEmailTemplate ? { label: 'Use system email', onAction: onRemoveTemplate } : undefined}
              disabledReason={customizeEmailBlockedReason}
              done={hasQuestionnaire}
            />
          </>
        ) : (
          <SetupCard
            icon={<Mail size={18} />}
            title="Email template"
            subtitle={emailTemplateLabel ?? 'No email template selected'}
            actionLabel={hasEmailTemplate ? 'Change template' : 'Select template'}
            onAction={onChangeTemplate}
            secondaryAction={hasEmailTemplate ? { label: 'Remove', onAction: onRemoveTemplate } : undefined}
            done={hasEmailTemplate}
          />
        )}

        <SetupCard
          icon={<Users size={18} />}
          title="Recipients"
          subtitle="People who will receive this campaign."
          actionLabel="Add recipients"
          onAction={onAddRecipients}
          done={hasRecipients}
          extra={
            <div className="mt-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{recipientCount}</span> total
            </div>
          }
        />
        {recipientsSlot && <div className="rounded-md border border-border bg-card p-4">{recipientsSlot}</div>}
        <SetupCard
          icon={<Repeat size={18} />}
          title="Recurrence"
          subtitle={isRecurring ? recurrenceLabel : 'Optionally repeat this campaign on a schedule.'}
          actionLabel={isRecurring ? 'Edit recurrence' : 'Set up recurrence'}
          onAction={onEditRecurrence}
          done={isRecurring}
        />
        <SetupCard icon={<SendHorizontal size={18} />} title="Send Test Email" subtitle="Preview your campaign and send a test email." actionLabel="Send test email" onAction={onSendTest} />
        <SetupCard
          icon={<Rocket size={18} />}
          title="Launch"
          subtitle={launchBlockedReason ?? 'Launch now or schedule for later.'}
          actionLabel="Launch campaign"
          onAction={onLaunch}
          disabledReason={launchBlockedReason}
          primary
        />
      </div>
    </div>
  )
}

interface SetupCardProps {
  icon: React.ReactNode
  title: string
  subtitle: string
  actionLabel: string
  onAction: () => void
  secondaryAction?: { label: string; onAction: () => void }
  done?: boolean
  primary?: boolean
  disabledReason?: string
  extra?: React.ReactNode
}

const SetupCard: React.FC<SetupCardProps> = ({ icon, title, subtitle, actionLabel, onAction, secondaryAction, done, primary, disabledReason, extra }) => (
  <div className="flex items-center gap-4 rounded-md border border-border bg-card p-4">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary">{icon}</div>
    <div className="flex min-w-0 flex-1 flex-col">
      <span className="text-sm font-semibold">{title}</span>
      <span className="text-xs text-muted-foreground">{subtitle}</span>
      {extra}
    </div>
    {secondaryAction && (
      <Button variant="secondary" type="button" onClick={secondaryAction.onAction} className="shrink-0">
        {secondaryAction.label}
      </Button>
    )}
    <DisabledReasonTooltip reason={disabledReason}>
      <Button variant={primary ? 'primary' : 'secondary'} type="button" onClick={onAction} disabled={!!disabledReason} className="shrink-0">
        {actionLabel}
      </Button>
    </DisabledReasonTooltip>
    <StepBadge done={done} size="sm" />
  </div>
)
