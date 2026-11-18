'use client'

import React from 'react'
import { useWatch, type UseFormReturn } from 'react-hook-form'
import { QuestionnaireEmailTemplatePicker, type QuestionnaireEmailPickerState } from '../../questionnaire-email/questionnaire-email-template-picker'
import { type CampaignFormData } from '../hooks/use-campaign-form-schema'

interface QuestionnaireEmailStepProps {
  form: UseFormReturn<CampaignFormData>
  pickerState: QuestionnaireEmailPickerState
  onPickerStateChange: React.Dispatch<React.SetStateAction<QuestionnaireEmailPickerState>>
}

export const QuestionnaireEmailStep: React.FC<QuestionnaireEmailStepProps> = ({ form, pickerState, onPickerStateChange }) => {
  const emailTemplateID = useWatch({ control: form.control, name: 'emailTemplateID' })

  return (
    <QuestionnaireEmailTemplatePicker
      value={emailTemplateID ?? ''}
      onChange={(id) => form.setValue('emailTemplateID', id, { shouldDirty: true })}
      state={pickerState}
      onStateChange={onPickerStateChange}
    />
  )
}
