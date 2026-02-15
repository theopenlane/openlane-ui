'use client'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Value } from 'platejs'
import { InternalPolicyDocumentStatus, InternalPolicyFrequency } from '@repo/codegen/src/schema'

const formSchema = z.object({
  name: z.string().min(1, {
    message: 'Name is required',
  }),
  details: z.custom<Value | string>().optional(),
  detailsJSON: z.custom<Value>().optional(),
  status: z.nativeEnum(InternalPolicyDocumentStatus, {
    errorMap: () => ({ message: 'Invalid status' }),
  }),
  approvalRequired: z.boolean(),
  reviewFrequency: z.nativeEnum(InternalPolicyFrequency, {
    errorMap: () => ({ message: 'Invalid status' }),
  }),
  internalPolicyKindName: z.string(),
  reviewDue: z.date().optional().nullable(),
  tags: z.array(z.string().optional()),
  programIDs: z.array(z.any()).optional(),
  procedureIDs: z.array(z.any()).optional(),
  controlObjectiveIDs: z.array(z.any()).optional(),
  controlIDs: z.array(z.any()).optional(),
  taskIDs: z.array(z.any()).optional(),
  approverID: z.string().optional(),
  delegateID: z.string().optional(),
})

export type CreatePolicyFormData = z.infer<typeof formSchema>
export type EditPolicyFormData = z.infer<typeof formSchema>

const useFormSchema = () => {
  return {
    form: useForm<CreatePolicyFormData>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        name: '',
        approvalRequired: true,
        status: InternalPolicyDocumentStatus.DRAFT,
        reviewFrequency: InternalPolicyFrequency.YEARLY,
        tags: [],
        internalPolicyKindName: '',
        details: `
            <div class="slate-editor group/editor relative w-full cursor-text overflow-x-hidden break-words whitespace-pre-wrap select-text rounded-md ring-offset-background focus-visible:outline-hidden placeholder:text-muted-foreground/80 [&_strong]:font-bold">
              <h2 class="slate-h2 relative mb-1 mt-[1.4em] pb-px font-heading text-2xl font-semibold tracking-tight">
                Purpose and Scope
              </h2>
              <em class="slate-italic">
                Explain why this policy exists (the business or security need it addresses) and who/what it applies to (e.g., employees, contractors, systems, environments).
              </em>
              <h2 class="slate-h2 relative mb-1 mt-[1.4em] pb-px font-heading text-2xl font-semibold tracking-tight">
                Background
              </h2>
              <em class="slate-italic">
                Provide any context that helps readers understand the policy’s importance, for example, regulatory requirements, past incidents, or industry standards that influenced it.
              </em>
              <h2 class="slate-h2 relative mb-1 mt-[1.4em] pb-px font-heading text-2xl font-semibold tracking-tight">
                Policy
              </h2>
              <em class="slate-italic">
                State the actual rules and expectations clearly. Use simple, enforceable language (e.g., “must,” “required,” “prohibited”) rather than vague terms. If the policy has multiple points, break them into short numbered or bulleted items.
              </em>
            </div>
          `,
      },
    }),
  }
}

export default useFormSchema
