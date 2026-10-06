'use client'

import { type UseFormReturn } from 'react-hook-form'
import { CalendarDays, ClipboardList, Users } from 'lucide-react'
import { startOfToday } from 'date-fns'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form'
import { Callout } from '@/components/shared/callout/callout'
import ObjectsChip from '@/components/shared/objects-chip/objects-chip'
import { ReadOnlyField } from '@/components/shared/read-only-field/read-only-field'
import { AssessmentRecipientSelect } from '@/components/shared/assessment-recipient-select/assessment-recipient-select'
import { AcknowledgementSection } from './acknowledgement-section'
import { type TAcknowledgementRequestFormData } from './use-acknowledgement-request-form-schema'

type TAcknowledgementRecipientsStepProps = {
  form: UseFormReturn<TAcknowledgementRequestFormData>
}

export const AcknowledgementRecipientsStep = ({ form }: TAcknowledgementRecipientsStepProps) => {
  const { policies, name, statement } = form.getValues()

  return (
    <div className="flex flex-col gap-6">
      <AcknowledgementSection icon={ClipboardList} title="What will be sent" className="rounded-lg border bg-muted/40 p-4">
        <ReadOnlyField label="Assessment name">{name}</ReadOnlyField>
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
      </AcknowledgementSection>

      <AcknowledgementSection icon={Users} title="Recipients">
        <FormField
          control={form.control}
          name="recipients"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Personnel, contacts or email addresses</FormLabel>
              <FormControl>
                <AssessmentRecipientSelect value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </AcknowledgementSection>

      <AcknowledgementSection icon={CalendarDays} title="Due date (optional)">
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

      <Callout variant="info" compact>
        Every recipient gets an email with a link to the acknowledgment as soon as the request is created.
      </Callout>
    </div>
  )
}
