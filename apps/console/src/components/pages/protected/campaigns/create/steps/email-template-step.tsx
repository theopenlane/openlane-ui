'use client'

import React from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { Button } from '@repo/ui/button'
import { SquarePlus, X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { useCampaignEmailTemplateSelect } from '@/lib/graphql-hooks/email-template'
import { type CampaignFormData } from '../hooks/use-campaign-form-schema'

interface EmailTemplateStepProps {
  form: UseFormReturn<CampaignFormData>
  onCreateTemplate: () => void
}

export const EmailTemplateStep: React.FC<EmailTemplateStepProps> = ({ form, onCreateTemplate }) => {
  const { emailTemplateOptions, isLoading } = useCampaignEmailTemplateSelect({ ensureId: form.watch('emailTemplateID') })

  return (
    <div className="flex flex-col gap-4">
      <FormField
        control={form.control}
        name="emailTemplateID"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="pb-1 block">Email Template</FormLabel>
            <Select key={field.value || 'empty'} value={field.value || undefined} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="w-full pr-2">
                  <SelectValue placeholder="Select an email template" />
                  {field.value ? (
                    <span
                      role="button"
                      aria-label="Clear email template"
                      className="ml-auto mr-1 inline-flex items-center justify-center p-0.5 text-muted-foreground"
                      onPointerDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        form.setValue('emailTemplateID', '', { shouldDirty: true })
                      }}
                    >
                      <X size={14} />
                    </span>
                  ) : null}
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {isLoading ? (
                  <div className="p-2 text-sm text-muted-foreground">Loading email templates...</div>
                ) : emailTemplateOptions.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">No email templates available</div>
                ) : (
                  emailTemplateOptions.map((option) => (
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
