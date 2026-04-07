'use client'

import React, { useCallback } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { useTemplateSelect } from '@/lib/graphql-hooks/template'
import { TemplateTemplateKind } from '@repo/codegen/src/schema'
import { type CampaignFormData } from '../hooks/use-campaign-form-schema'

interface QuestionnaireStepProps {
  form: UseFormReturn<CampaignFormData>
}

export const QuestionnaireStep: React.FC<QuestionnaireStepProps> = ({ form }) => {
  const { templateOptions, templates, isLoading } = useTemplateSelect({ where: { kind: TemplateTemplateKind.QUESTIONNAIRE } })

  const populateFromQuestionnaire = useCallback(
    (val: string) => {
      const template = templates?.find((t) => t.id === val)
      if (template) {
        form.setValue('name', template.name, { shouldDirty: true })
        form.setValue('description', template.description ?? '', { shouldDirty: true })
      } else {
        form.setValue('name', '', { shouldDirty: true })
        form.setValue('description', '', { shouldDirty: true })
      }
    },
    [form, templates],
  )

  return (
    <div className="flex flex-col gap-4">
      <FormField
        control={form.control}
        name="questionnaireTemplateID"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="pb-1 block">Questionnaire</FormLabel>
            <Select
              value={field.value || undefined}
              onValueChange={(val) => {
                field.onChange(val)
                populateFromQuestionnaire(val)
              }}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select one from the list" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {isLoading ? (
                  <div className="p-2 text-sm text-muted-foreground">Loading questionnaires...</div>
                ) : templateOptions.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">No questionnaires available</div>
                ) : (
                  templateOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />
    </div>
  )
}
