'use client'

import React from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { type CampaignFormData } from '../hooks/use-campaign-form-schema'
import { QuestionnaireSelector } from './questionnaire/questionnaire-selector'

interface QuestionnaireStepProps {
  form: UseFormReturn<CampaignFormData>
}

export const QuestionnaireStep: React.FC<QuestionnaireStepProps> = ({ form }) => {
  return (
    <div className="flex flex-col gap-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="pb-1 block">
              Campaign Name<span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ''} placeholder="Enter a campaign name" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="pb-1 block">Description</FormLabel>
            <FormControl>
              <Textarea {...field} value={field.value ?? ''} placeholder="Describe the purpose of this campaign..." rows={3} />
            </FormControl>
          </FormItem>
        )}
      />
      <QuestionnaireSelector form={form} />
    </div>
  )
}
