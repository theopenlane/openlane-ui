'use client'

import React from 'react'
import { Button } from '@repo/ui/button'
import { cn } from '@repo/ui/lib/utils'
import { Calendar, Check, CircleCheck, Circle, CircleHelp, FileText, Mail, Rocket, SendHorizontal, Users } from 'lucide-react'
import { formatDate } from '@/utils/date'

interface CampaignSetupViewProps {
  emailTemplateName?: string
  questionnaireName?: string
  questionnaireQuestionCount?: number
  dueDate?: string | null
  recipientCount: number
  onEditDetails: () => void
  onChangeTemplate: () => void
  onConfigureQuestionnaire: () => void
  onRemoveQuestionnaire: () => void
  onAddRecipients: () => void
  onSendTest: () => void
  onLaunch: () => void
}

export const CampaignSetupView: React.FC<CampaignSetupViewProps> = ({
  emailTemplateName,
  questionnaireName,
  questionnaireQuestionCount = 0,
  dueDate,
  recipientCount,
  onEditDetails,
  onChangeTemplate,
  onConfigureQuestionnaire,
  onRemoveQuestionnaire,
  onAddRecipients,
  onSendTest,
  onLaunch,
}) => {
  const hasEmailTemplate = !!emailTemplateName
  const hasQuestionnaire = !!questionnaireName
  const hasRecipients = recipientCount > 0

  const trackerSteps = [
    { label: 'Details', hint: 'Campaign information', done: true },
    { label: 'Email template', hint: emailTemplateName ?? 'Not set', done: hasEmailTemplate },
    { label: 'Questionnaire', hint: 'Optional', done: hasQuestionnaire },
    { label: 'Recipients', hint: 'Add or import recipients', done: hasRecipients },
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
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-full border text-sm', step.done ? 'border-brand bg-brand text-white' : 'border-border text-muted-foreground')}>
                  {step.done ? <Check size={16} /> : index + 1}
                </div>
                <span className="text-xs font-medium">{step.label}</span>
                <span className="text-[11px] text-muted-foreground">{step.hint}</span>
              </div>
              {index < trackerSteps.length - 1 && <div className={cn('mt-4 h-0.5 flex-1', step.done ? 'bg-brand' : 'bg-border')} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <SetupCard icon={<FileText size={18} className="text-brand" />} title="Details" subtitle="Campaign information" actionLabel="Edit details" onAction={onEditDetails} done />
        <SetupCard
          icon={<Mail size={18} className="text-brand" />}
          title="Email template"
          subtitle={emailTemplateName ?? 'No template selected'}
          actionLabel="Change template"
          onAction={onChangeTemplate}
          done={hasEmailTemplate}
        />
        <SetupCard
          icon={<CircleHelp size={18} className="text-brand" />}
          title="Questionnaire (optional)"
          subtitle={questionnaireName ?? 'No questionnaire attached'}
          actionLabel="Configure questionnaire"
          onAction={onConfigureQuestionnaire}
          secondaryAction={hasQuestionnaire ? { label: 'Remove', onAction: onRemoveQuestionnaire } : undefined}
          done={hasQuestionnaire}
          extra={
            hasQuestionnaire ? (
              <div className="mt-1 flex flex-col gap-1 text-xs text-muted-foreground">
                <span>
                  {questionnaireQuestionCount} question{questionnaireQuestionCount === 1 ? '' : 's'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar size={12} /> Due date: {dueDate ? formatDate(dueDate) : 'Not set'}
                </span>
              </div>
            ) : undefined
          }
        />
        <SetupCard
          icon={<Users size={18} className="text-brand" />}
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
        <SetupCard
          icon={<SendHorizontal size={18} className="text-brand" />}
          title="Send Test Email"
          subtitle="Preview your campaign and send a test email."
          actionLabel="Send test email"
          onAction={onSendTest}
        />
        <SetupCard icon={<Rocket size={18} className="text-brand" />} title="Launch" subtitle="Launch now or schedule for later." actionLabel="Launch campaign" onAction={onLaunch} primary />
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
  extra?: React.ReactNode
}

const SetupCard: React.FC<SetupCardProps> = ({ icon, title, subtitle, actionLabel, onAction, secondaryAction, done, primary, extra }) => (
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
    <Button variant={primary ? 'primary' : 'secondary'} type="button" onClick={onAction} className="shrink-0">
      {actionLabel}
    </Button>
    {done ? <CircleCheck size={20} className="shrink-0 text-brand" /> : <Circle size={20} className="shrink-0 text-muted-foreground" />}
  </div>
)
