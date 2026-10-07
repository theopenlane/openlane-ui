import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { startOfToday } from 'date-fns'
import { DEFAULT_ACKNOWLEDGEMENT_STATEMENT } from '@/components/shared/survey/acknowledgement/acknowledgement-type'
import { type TAssessmentRecipientOption } from '@/components/shared/assessment-recipient-select/assessment-recipient-select'
import { type TInternalPolicyDocument } from '@/lib/graphql-hooks/internal-policy'

export const MAX_ACKNOWLEDGEMENT_POLICIES = 10
export const MAX_ACKNOWLEDGEMENT_POLICIES_MESSAGE = `An acknowledgment request can include up to ${MAX_ACKNOWLEDGEMENT_POLICIES} policies.`

const formSchema = z.object({
  policies: z.array(z.custom<TInternalPolicyDocument>()).min(1, 'Select at least one policy.').max(MAX_ACKNOWLEDGEMENT_POLICIES, MAX_ACKNOWLEDGEMENT_POLICIES_MESSAGE),
  name: z.string().trim().min(1, 'Name is required.'),
  statement: z.string().trim().min(1, 'Acknowledgment statement is required.'),
  recipients: z.array(z.custom<TAssessmentRecipientOption>()),
  dueDate: z
    .date()
    .nullable()
    .refine((date) => !date || date >= startOfToday(), 'The due date cannot be in the past.'),
})

export type TAcknowledgementRequestFormData = z.infer<typeof formSchema>

export const suggestAssessmentName = (policies: TInternalPolicyDocument[]) => (policies.length === 1 ? `${policies[0].name} Acknowledgment` : 'Policy Acknowledgment')

export const useAcknowledgementRequestFormSchema = (policies: TInternalPolicyDocument[]) =>
  useForm<TAcknowledgementRequestFormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: { policies, name: suggestAssessmentName(policies), statement: DEFAULT_ACKNOWLEDGEMENT_STATEMENT, recipients: [], dueDate: null },
  })
