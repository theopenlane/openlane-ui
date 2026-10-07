'use client'

import { type UseFormReturn } from 'react-hook-form'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form'
import { Callout } from '@/components/shared/callout/callout'
import { AcknowledgementPolicySelect } from './acknowledgement-policy-select'
import { ACKNOWLEDGEMENT_SECTION_TITLE_CLASS, AcknowledgementSection, AcknowledgementSections } from './acknowledgement-section'
import { type TAcknowledgementRequestFormData } from './use-acknowledgement-request-form-schema'

type TAcknowledgementDetailsStepProps = {
  form: UseFormReturn<TAcknowledgementRequestFormData>
}

export const AcknowledgementDetailsStep = ({ form }: TAcknowledgementDetailsStepProps) => (
  <AcknowledgementSections>
    <AcknowledgementSection>
      <FormField
        control={form.control}
        name="policies"
        render={({ field }) => (
          <FormItem>
            <FormLabel required className={ACKNOWLEDGEMENT_SECTION_TITLE_CLASS}>
              Policies
            </FormLabel>
            <FormControl>
              <AcknowledgementPolicySelect value={field.value} onChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </AcknowledgementSection>

    <AcknowledgementSection title="Acknowledgment details">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel required className="text-sm text-muted-foreground">
              Name
            </FormLabel>
            <FormControl>
              <Input {...field} maxWidth />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </AcknowledgementSection>

    <AcknowledgementSection title="Acknowledgment setup">
      <FormField
        control={form.control}
        name="statement"
        render={({ field }) => (
          <FormItem>
            <FormLabel required className="text-sm text-muted-foreground">
              Acknowledgment statement
            </FormLabel>
            <FormControl>
              <Textarea {...field} rows={3} />
            </FormControl>
            <FormDescription>Recipients must confirm this statement and sign after reviewing all policies.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </AcknowledgementSection>

    <Callout variant="plain">Recipients and an optional due date are added in the next step when you select Send now.</Callout>
  </AcknowledgementSections>
)
