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
  status: z
    .enum(InternalPolicyDocumentStatus, {
      error: () => ({ message: 'Invalid status' }),
    })
    .default(InternalPolicyDocumentStatus.DRAFT),
  approvalRequired: z.boolean(),
  reviewFrequency: z
    .enum(InternalPolicyFrequency, {
      error: () => ({ message: 'Invalid status' }),
    })
    .default(InternalPolicyFrequency.YEARLY),
  policyType: z.string(),
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
        policyType: '',
        details: `
            <div class="slate-editor" data-slate-editor="true" data-slate-node="value">
              <div data-slate-node="element" class="slate-p m-0 px-0 py-1" data-slate-type="p" style="position:relative">
                <span data-slate-node="text">
                  <span data-slate-leaf="true" class="" style="font-size:18px" data-slate-font-size="18px">
                    <span data-slate-string="true">Purpose and Scope</span>
                  </span>
                </span>
              </div>
              <div data-slate-node="element" class="slate-p m-0 px-0 py-1" data-slate-type="p" style="position:relative">
                <span data-slate-node="text">
                  <span data-slate-leaf="true" class="" style="font-size:12px" data-slate-font-size="12px">
                    <span data-slate-string="true">< Why the policy exists and the scope it covers >  </span>
                  </span>
                </span>
              </div>
              <div data-slate-node="element" class="slate-p m-0 px-0 py-1" data-slate-type="p" style="position:relative">
                <span data-slate-node="text">
                  <span data-slate-leaf="true" class="" style="font-size:18px" data-slate-font-size="18px">
                    <span data-slate-string="true">Background</span>
                  </span>
                </span>
              </div>
              <div data-slate-node="element" class="slate-p m-0 px-0 py-1" data-slate-type="p" style="position:relative">
                <span data-slate-node="text">
                  <span data-slate-leaf="true" class="" style="font-size:12px" data-slate-font-size="12px">
                    <span data-slate-string="true">< Any relevant background of the policy >     </span>
                  </span>
                </span>
              </div>
              <div data-slate-node="element" class="slate-p m-0 px-0 py-1" data-slate-type="p" style="position:relative">
                <span data-slate-node="text">
                  <span data-slate-leaf="true" class="" style="font-size:18px" data-slate-font-size="18px">
                    <span data-slate-string="true">Policy</span>
                  </span>
                </span>
              </div>
              <div data-slate-node="element" class="slate-p m-0 px-0 py-1" data-slate-type="p" style="position:relative">
                <span data-slate-node="text">
                  <span data-slate-leaf="true" class="" style="font-size:12px" data-slate-font-size="12px">
                    <span data-slate-string="true">< Details of the policy >  </span>
                  </span>
                </span>
              </div>
            </div>
          `,
      },
    }),
  }
}

export default useFormSchema
