'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@theopenlane/ui/dialog'
import { Select, SelectTrigger, SelectValue } from '@theopenlane/ui/select'
import { EmailTemplateSelectContent } from '../shared/email-template-select-content'
import { Button } from '@theopenlane/ui/button'
import { cn } from '@theopenlane/ui/lib/utils'
import { EmailTemplateType } from '@/lib/email-template-type'
import { initialQuestionnaireEmailPickerState, QuestionnaireEmailTemplatePicker, type QuestionnaireEmailPickerState } from '../questionnaire-email/questionnaire-email-template-picker'

interface ChangeTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateType: EmailTemplateType
  options: Array<{ label: string; value: string }>
  value?: string
  isLoading?: boolean
  onSave: (emailTemplateID: string) => Promise<void> | void
  isPending?: boolean
}

export const ChangeTemplateDialog: React.FC<ChangeTemplateDialogProps> = ({ open, onOpenChange, ...formProps }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className={cn('flex min-w-0 flex-col', formProps.templateType === EmailTemplateType.QUESTIONNAIRE ? 'max-h-[90vh] max-w-3xl overflow-y-auto' : 'max-w-md')}>
      <ChangeTemplateForm {...formProps} onCancel={() => onOpenChange(false)} />
    </DialogContent>
  </Dialog>
)

type ChangeTemplateFormProps = Omit<ChangeTemplateDialogProps, 'open' | 'onOpenChange'> & { onCancel: () => void }

const ChangeTemplateForm: React.FC<ChangeTemplateFormProps> = ({ templateType, options, value, isLoading, onSave, isPending, onCancel }) => {
  const [selected, setSelected] = useState<string>(value ?? '')
  const [pickerState, setPickerState] = useState<QuestionnaireEmailPickerState>(() => initialQuestionnaireEmailPickerState({ customize: true }))
  const isQuestionnaire = templateType === EmailTemplateType.QUESTIONNAIRE
  const canSave = isQuestionnaire ? selected !== (value ?? '') : !!selected

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isQuestionnaire ? 'Questionnaire email' : 'Change email template'}</DialogTitle>
        <p className="text-sm text-muted-foreground">
          {isQuestionnaire ? 'Send the system questionnaire email, or customize the email recipients receive.' : 'Choose the email template used to contact recipients.'}
        </p>
      </DialogHeader>

      {isQuestionnaire ? (
        <QuestionnaireEmailTemplatePicker value={selected} onChange={setSelected} state={pickerState} onStateChange={setPickerState} disabled={isPending} />
      ) : (
        <Select value={selected || undefined} onValueChange={setSelected}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an email template" />
          </SelectTrigger>
          <EmailTemplateSelectContent options={options} isLoading={isLoading} />
        </Select>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" type="button" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button variant="primary" type="button" onClick={() => onSave(selected)} disabled={isPending || !canSave}>
          {isPending ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </>
  )
}
