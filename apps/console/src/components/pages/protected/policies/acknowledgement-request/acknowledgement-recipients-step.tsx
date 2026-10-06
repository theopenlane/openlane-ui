'use client'

import { type UseFormReturn } from 'react-hook-form'
import { ClipboardList, ExternalLink } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { startOfToday } from 'date-fns'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form'
import { Callout } from '@/components/shared/callout/callout'
import ObjectsChip from '@/components/shared/objects-chip/objects-chip'
import { ReadOnlyField } from '@/components/shared/read-only-field/read-only-field'
import { AssessmentRecipientSelect } from '@/components/shared/assessment-recipient-select/assessment-recipient-select'
import { AcknowledgementSection, AcknowledgementSections } from './acknowledgement-section'
import { type TAcknowledgementRequestFormData } from './use-acknowledgement-request-form-schema'

type TAcknowledgementRecipientsStepProps = {
  form: UseFormReturn<TAcknowledgementRequestFormData>
  onPreview: () => void
}

export const AcknowledgementRecipientsStep = ({ form, onPreview }: TAcknowledgementRecipientsStepProps) => {
  const { policies, name, statement } = form.getValues()

  return (
    <AcknowledgementSections>
      <AcknowledgementSection icon={ClipboardList} title="What will be sent">
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-4">
          <div className="flex items-start justify-between gap-3">
            <ReadOnlyField label="Name">{name}</ReadOnlyField>
            <Button type="button" variant="secondary" icon={<ExternalLink size={14} />} iconPosition="left" onClick={onPreview}>
              Preview
            </Button>
          </div>
          <ReadOnlyField label="Policies">
            <div className="flex flex-wrap gap-2">
              {policies.map((policy) => (
                <ObjectsChip key={policy.id} name={policy.name} objectType="policies" />
              ))}
            </div>
          </ReadOnlyField>
          <ReadOnlyField label="Acknowledgment statement">
            <p className="whitespace-pre-line">{statement}</p>
          </ReadOnlyField>
        </div>
      </AcknowledgementSection>

      <AcknowledgementSection title="Recipients">
        <FormField
          control={form.control}
          name="recipients"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-muted-foreground">Personnel or email addresses (required to send)</FormLabel>
              <FormControl>
                <AssessmentRecipientSelect value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </AcknowledgementSection>

      <AcknowledgementSection title="Due date (optional)">
        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Due date</FormLabel>
              <FormControl>
                <CalendarPopover field={field} portal disabledFrom={startOfToday()} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </AcknowledgementSection>

      <Callout variant="plain">Every recipient gets an email with a link to the acknowledgment when you select Create &amp; send.</Callout>
    </AcknowledgementSections>
  )
}
