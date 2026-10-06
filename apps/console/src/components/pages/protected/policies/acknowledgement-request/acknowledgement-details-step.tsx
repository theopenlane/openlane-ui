'use client'

import { type UseFormReturn } from 'react-hook-form'
import { ClipboardList, ListChecks } from 'lucide-react'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form'
import { Callout } from '@/components/shared/callout/callout'
import { AcknowledgementPolicySelect } from './acknowledgement-policy-select'
import { AcknowledgementSection, PolicyIcon } from './acknowledgement-section'
import { type TAcknowledgementRequestFormData } from './use-acknowledgement-request-form-schema'

type TAcknowledgementDetailsStepProps = {
  form: UseFormReturn<TAcknowledgementRequestFormData>
}

export const AcknowledgementDetailsStep = ({ form }: TAcknowledgementDetailsStepProps) => (
  <div className="flex flex-col gap-6">
    <AcknowledgementSection icon={PolicyIcon} title="Policies">
      <FormField
        control={form.control}
        name="policies"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="sr-only">Policies</FormLabel>
            <FormControl>
              <AcknowledgementPolicySelect value={field.value} onChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </AcknowledgementSection>

    <AcknowledgementSection icon={ClipboardList} title="Assessment details">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Assessment name</FormLabel>
            <FormControl>
              <Input {...field} maxWidth />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </AcknowledgementSection>

    <AcknowledgementSection icon={ListChecks} title="Acknowledgment setup">
      <FormField
        control={form.control}
        name="statement"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Acknowledgment statement</FormLabel>
            <FormControl>
              <Textarea {...field} rows={3} />
            </FormControl>
            <FormDescription>Recipients tick this statement and sign after reading every policy.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </AcknowledgementSection>

    <Callout variant="info" compact>
      Choose recipients and a due date in the next step when you select Send now.
    </Callout>
  </div>
)
