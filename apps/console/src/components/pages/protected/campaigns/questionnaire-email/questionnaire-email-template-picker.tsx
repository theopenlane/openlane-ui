'use client'

import React from 'react'
import { Lock, Pencil } from 'lucide-react'
import { Select, SelectTrigger, SelectValue } from '@repo/ui/select'
import { EmailTemplateSelectContent } from '../shared/email-template-select-content'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { useCampaignEmailTemplateSelect } from '@/lib/graphql-hooks/email-template'
import { EmailTemplateType } from '@/lib/email-template-type'
import { InlineEmailTemplateCreator, type InlineEmailTemplateDraft } from '@/components/pages/protected/communications/email-templates/inline-email-template-creator'
import { ModeOption } from '../shared/mode-option'
import { isOneOf } from '@/utils/type-guards'

const TEMPLATE_SOURCES = ['existing', 'new'] as const
type TemplateSource = (typeof TEMPLATE_SOURCES)[number]
const isTemplateSource = isOneOf(TEMPLATE_SOURCES)

export type QuestionnaireEmailPickerState = { customize: boolean; source: TemplateSource; draft: InlineEmailTemplateDraft | null }

export const initialQuestionnaireEmailPickerState = (emailTemplateID?: string | null): QuestionnaireEmailPickerState => ({
  customize: !!emailTemplateID,
  source: 'existing',
  draft: null,
})

interface QuestionnaireEmailTemplatePickerProps {
  value: string
  onChange: (emailTemplateID: string) => void
  state: QuestionnaireEmailPickerState
  onStateChange: React.Dispatch<React.SetStateAction<QuestionnaireEmailPickerState>>
  disabled?: boolean
}

export const QuestionnaireEmailTemplatePicker: React.FC<QuestionnaireEmailTemplatePickerProps> = ({ value, onChange, state, onStateChange, disabled }) => {
  const { customize, source, draft } = state
  const setSource = (next: TemplateSource) => onStateChange((current) => ({ ...current, source: next }))
  const { emailTemplateOptions, isLoading } = useCampaignEmailTemplateSelect({ type: EmailTemplateType.QUESTIONNAIRE, ensureId: value, enabled: customize })

  const selectSystemEmail = () => {
    onStateChange((current) => ({ ...current, customize: false, source: 'existing' }))
    if (value) onChange('')
  }

  const handleCreated = (emailTemplateID: string) => {
    onChange(emailTemplateID)
    onStateChange((current) => ({ ...current, source: 'existing', draft: null }))
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="radiogroup" aria-label="Questionnaire email" className="grid grid-cols-2 gap-3">
        <ModeOption
          icon={<Lock size={18} />}
          title="System email"
          description="Recipients receive the default questionnaire email."
          selected={!customize}
          disabled={disabled}
          onSelect={selectSystemEmail}
        />
        <ModeOption
          icon={<Pencil size={18} />}
          title="Customize email"
          description="Choose or create a questionnaire email template."
          selected={customize}
          disabled={disabled}
          onSelect={() => onStateChange((current) => ({ ...current, customize: true }))}
        />
      </div>

      {customize && (
        <>
          <Tabs variant="solid" value={source} onValueChange={(next) => isTemplateSource(next) && setSource(next)}>
            <TabsList className="w-fit">
              <TabsTrigger value="existing">Choose existing</TabsTrigger>
              <TabsTrigger value="new">Create new</TabsTrigger>
            </TabsList>
          </Tabs>

          {source === 'existing' ? (
            <Select key={value || 'empty'} value={value || undefined} onValueChange={onChange} disabled={disabled}>
              <SelectTrigger className="w-full" aria-label="Questionnaire email template">
                <SelectValue placeholder="Select a questionnaire email template" />
              </SelectTrigger>
              <EmailTemplateSelectContent options={emailTemplateOptions} isLoading={isLoading} emptyText="No questionnaire email templates yet. Use Create new to add one." />
            </Select>
          ) : (
            <InlineEmailTemplateCreator
              type={EmailTemplateType.QUESTIONNAIRE}
              draft={draft}
              onDraftChange={(next) => onStateChange((current) => ({ ...current, draft: next }))}
              onCreated={handleCreated}
              onCancel={() => onStateChange((current) => ({ ...current, source: 'existing', draft: null }))}
            />
          )}

          {!value && source === 'existing' && <p className="text-xs text-muted-foreground">Until you pick a template, recipients receive the system email.</p>}
        </>
      )}
    </div>
  )
}
