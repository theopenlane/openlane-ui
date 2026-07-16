'use client'

import React, { useCallback } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { useTemplateSelect } from '@/lib/graphql-hooks/template'
import { TemplateTemplateKind } from '@repo/codegen/src/schema'
import { type CampaignFormData } from '../hooks/use-campaign-form-schema'

interface QuestionnaireStepProps {
  form: UseFormReturn<CampaignFormData>
}

export const QuestionnaireStep: React.FC<QuestionnaireStepProps> = ({ form }) => {
  const { templateOptions, templates, isLoading } = useTemplateSelect({ where: { kind: TemplateTemplateKind.QUESTIONNAIRE } })

  const applyQuestionnaireDefaults = useCallback(
    (templateId: string) => {
      const template = templates?.find((t) => t.id === templateId)
      if (!template) return

      if (!form.getValues('name')?.trim()) {
        form.setValue('name', template.name, { shouldDirty: true, shouldValidate: true })
      }
      if (!form.getValues('description')?.trim()) {
        form.setValue('description', template.description ?? '', { shouldDirty: true })
      }
    },
    [form, templates],
  )

  const handleClear = useCallback(
    (e: React.PointerEvent | React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      form.setValue('questionnaireTemplateID', '', { shouldDirty: true })
    },
    [form],
  )

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
      <FormField
        control={form.control}
        name="questionnaireTemplateID"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="pb-1 block">Questionnaire</FormLabel>
            <Select
              key={field.value || 'empty'}
              value={field.value || undefined}
              onValueChange={(val) => {
                field.onChange(val)
                applyQuestionnaireDefaults(val)
              }}
            >
              <FormControl>
                <SelectTrigger className="w-full pr-2">
                  <SelectValue placeholder="Select one from the list" />
                  {field.value ? (
                    <span
                      role="button"
                      aria-label="Clear questionnaire"
                      className="ml-auto mr-1 inline-flex items-center justify-center p-0.5 text-muted-foreground"
                      onPointerDown={handleClear}
                      onClick={handleClear}
                    >
                      <X size={14} />
                    </span>
                  ) : null}
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
