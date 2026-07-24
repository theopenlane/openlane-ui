'use client'

import React, { useState } from 'react'
import { Button } from '@repo/ui/button'
import { cn } from '@repo/ui/lib/utils'
import { AlertTriangle, Calendar, Check, CircleCheck, Circle, CircleHelp, FileText, Lock, Mail, Rocket, SendHorizontal, Users } from 'lucide-react'
import { formatDate } from '@/utils/date'
import { ModeOption } from './mode-option'

type CampaignContentMode = 'questionnaire' | 'email'

interface CampaignSetupViewProps {
  hasEmailTemplate: boolean
  emailTemplateName?: string
  isLoadingTemplates?: boolean
  questionnaireName?: string
  questionnaireQuestionCount?: number
  dueDate?: string | null
  recipientCount: number
  isUpdating?: boolean
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
  emailTemplateName,
  isLoadingTemplates,
  questionnaireName,
  questionnaireQuestionCount = 0,
  dueDate,
  recipientCount,
  isUpdating,
  onEditDetails,
  onChangeTemplate,
  onRemoveTemplate,
  onConfigureQuestionnaire,
  onRemoveQuestionnaire,
  onAddRecipients,
  onSendTest,
  onLaunch,
}) => {
  const hasQuestionnaire = !!questionnaireName
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

  const emailTemplateLabel = emailTemplateName ?? (hasEmailTemplate && isLoadingTemplates ? 'Loading...' : undefined)
  const contentStepHint = mode === 'questionnaire' ? (questionnaireName ?? 'Not set') : (emailTemplateLabel ?? 'Not set')

  const trackerSteps = [
    { label: 'Details', hint: 'Campaign information', done: true },
    { label: mode === 'questionnaire' ? 'Questionnaire' : 'Email template', hint: contentStepHint, done: hasContent },
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

        <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold">Campaign content</span>
            <span className="text-xs text-muted-foreground">A campaign uses either a questionnaire template or an email template, not both.</span>
          </div>

          <div role="radiogroup" aria-label="Campaign content type" className="grid grid-cols-2 gap-3">
            <ModeOption
              icon={<CircleHelp size={18} className="text-brand" />}
              title="Questionnaire template"
              description="Recipients complete a questionnaire. Emails use the system template."
              selected={mode === 'questionnaire'}
              disabled={isUpdating}
              onSelect={() => handleModeChange('questionnaire')}
            />
            <ModeOption
              icon={<Mail size={18} className="text-brand" />}
              title="Email template"
              description="Recipients receive the email template you choose."
              selected={mode === 'email'}
              disabled={isUpdating}
              onSelect={() => handleModeChange('email')}
            />
          </div>

          {!hasContent && (
            <div className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
              <span className="text-xs text-muted-foreground">Select either a questionnaire template or an email template before launching this campaign.</span>
            </div>
          )}
        </div>

        {mode === 'questionnaire' ? (
          <>
            <SetupCard
              icon={<CircleHelp size={18} className="text-brand" />}
              title="Questionnaire template"
              subtitle={questionnaireName ?? 'No questionnaire template selected'}
              actionLabel={hasQuestionnaire ? 'Change questionnaire template' : 'Select questionnaire template'}
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
            <div className="flex items-center gap-4 rounded-md border border-border bg-card p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary">
                <Mail size={18} className="text-brand" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-semibold">Email template</span>
                <span className="text-xs text-muted-foreground">System template</span>
              </div>
              <Lock size={16} className="shrink-0 text-muted-foreground" />
            </div>
          </>
        ) : (
          <SetupCard
            icon={<Mail size={18} className="text-brand" />}
            title="Email template"
            subtitle={emailTemplateLabel ?? 'No email template selected'}
            actionLabel={hasEmailTemplate ? 'Change template' : 'Select template'}
            onAction={onChangeTemplate}
            secondaryAction={hasEmailTemplate ? { label: 'Remove', onAction: onRemoveTemplate } : undefined}
            done={hasEmailTemplate}
          />
        )}

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
        <SetupCard
          icon={<Rocket size={18} className="text-brand" />}
          title="Launch"
          subtitle={hasContent ? 'Launch now or schedule for later.' : 'Select a questionnaire template or an email template first.'}
          actionLabel="Launch campaign"
          onAction={onLaunch}
          disabled={!hasContent}
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
  disabled?: boolean
  extra?: React.ReactNode
}

const SetupCard: React.FC<SetupCardProps> = ({ icon, title, subtitle, actionLabel, onAction, secondaryAction, done, primary, disabled, extra }) => (
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
    <Button variant={primary ? 'primary' : 'secondary'} type="button" onClick={onAction} disabled={disabled} className="shrink-0">
      {actionLabel}
    </Button>
    {done ? <CircleCheck size={20} className="shrink-0 text-brand" /> : <Circle size={20} className="shrink-0 text-muted-foreground" />}
  </div>
)
