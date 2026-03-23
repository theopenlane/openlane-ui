'use client'

import React, { useCallback, useMemo } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { Button } from '@repo/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@repo/ui/form'
import { SquarePlus } from 'lucide-react'
import { useTemplateSelect } from '@/lib/graphql-hooks/template'
import { type CampaignFormData } from '../hooks/use-campaign-form-schema'

interface TemplateStepProps {
  form: UseFormReturn<CampaignFormData>
  onCreateTemplate: () => void
}

export const TemplateStep: React.FC<TemplateStepProps> = ({ form, onCreateTemplate }) => {
  const { templateOptions, templates, isLoading } = useTemplateSelect({ where: {} })
  const templateId = form.watch('templateID')

  const selectedTemplate = useMemo(() => templates?.find((t) => t.id === templateId), [templates, templateId])

  const handleTemplateChange = useCallback(
    (val: string) => {
      const id = val || undefined
      form.setValue('templateID', val, { shouldDirty: true, shouldValidate: true })

      const template = templates?.find((t) => t.id === id)
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
        name="templateID"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Campaign Template</FormLabel>
            <Select value={field.value ?? ''} onValueChange={handleTemplateChange}>
              <FormControl>
                <SelectTrigger className="w-full">{templateId ? templateOptions.find((t) => t.value === templateId)?.label ?? 'Select a template' : 'Select a template'}</SelectTrigger>
              </FormControl>
              <SelectContent>
                {isLoading ? (
                  <div className="p-2 text-sm text-muted-foreground">Loading templates...</div>
                ) : templateOptions.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">No templates available</div>
                ) : (
                  templateOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex items-center justify-between rounded-md border border-border p-3">
        <span className="text-sm text-muted-foreground">Don&apos;t see a template?</span>
        <Button variant="primary" icon={<SquarePlus size={16} />} iconPosition="left" onClick={onCreateTemplate} type="button">
          Create Template
        </Button>
      </div>

      {selectedTemplate && (
        <div className="flex flex-col gap-3 rounded-md border border-border p-4">
          <h4 className="text-sm font-semibold">Template Details</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-muted-foreground">Name</span>
              <p className="text-sm">{selectedTemplate.name}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Type</span>
              <p className="text-sm">{selectedTemplate.templateType ?? '—'}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Owner</span>
              <p className="text-sm">{selectedTemplate.owner?.displayName ?? '—'}</p>
            </div>
          </div>
          {selectedTemplate.description && (
            <div>
              <span className="text-xs text-muted-foreground">Description</span>
              <p className="text-sm">{selectedTemplate.description}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
