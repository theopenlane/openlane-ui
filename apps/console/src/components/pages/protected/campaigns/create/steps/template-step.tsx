'use client'

import React from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { Button } from '@repo/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { SquarePlus } from 'lucide-react'
import { useTemplateSelect } from '@/lib/graphql-hooks/template'
import { type CampaignFormData } from '../hooks/use-campaign-form-schema'

interface TemplateStepProps {
  form: UseFormReturn<CampaignFormData>
  onCreateTemplate: () => void
}

export const TemplateStep: React.FC<TemplateStepProps> = ({ form, onCreateTemplate }) => {
  const { templateOptions, isLoading } = useTemplateSelect({ where: {} })

  return (
    <div className="flex flex-col gap-4">
      <FormField
        control={form.control}
        name="templateID"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="pb-1 block">Campaign Template</FormLabel>
            <Select
              value={field.value || undefined}
              onValueChange={(val) => {
                field.onChange(val)
              }}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
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
          </FormItem>
        )}
      />

      <div className="flex items-center justify-between rounded-md border border-border p-3">
        <span className="text-sm text-muted-foreground">Don&apos;t see a template?</span>
        <Button variant="secondary" icon={<SquarePlus size={16} />} iconPosition="left" onClick={onCreateTemplate} type="button">
          Create an email template
        </Button>
      </div>
    </div>
  )
}
