'use client'

import React from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { Button } from '@theopenlane/ui/button'
import { SquarePlus, X } from 'lucide-react'
import { Select, SelectTrigger, SelectValue } from '@theopenlane/ui/select'
import { EmailTemplateSelectContent } from '../../shared/email-template-select-content'
import { FormField, FormItem, FormLabel, FormControl } from '@theopenlane/ui/form'
import { useCampaignEmailTemplateSelect } from '@/lib/graphql-hooks/email-template'
import { EmailTemplateType } from '@/lib/email-template-type'
import { type CampaignFormData } from '../hooks/use-campaign-form-schema'
import { emailTemplateCreateHref } from '@/constants/email-template-routes'

interface EmailTemplateStepProps {
  form: UseFormReturn<CampaignFormData>
}

export const EmailTemplateStep: React.FC<EmailTemplateStepProps> = ({ form }) => {
  const { emailTemplateOptions, isLoading } = useCampaignEmailTemplateSelect({ type: EmailTemplateType.GENERAL, ensureId: form.watch('emailTemplateID') })

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
              <EmailTemplateSelectContent options={emailTemplateOptions} isLoading={isLoading} />
            </Select>
          </FormItem>
        )}
      />

      <div className="flex items-center justify-between rounded-md border border-border p-3">
        <span className="text-sm text-muted-foreground">Don&apos;t see a template?</span>
        <Button
          variant="secondary"
          icon={<SquarePlus size={16} />}
          iconPosition="left"
          onClick={() => window.open(emailTemplateCreateHref(EmailTemplateType.GENERAL), '_blank', 'noopener,noreferrer')}
          type="button"
        >
          Create an email template
        </Button>
      </div>
    </div>
  )
}
