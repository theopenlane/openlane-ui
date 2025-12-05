import { z } from 'zod'
import { UseFormReturn } from 'react-hook-form'
import { TErrorProps } from '@/hooks/useNotification'

export const step1Schema = z.object({
  categories: z.array(z.string()),
  standardID: z.string().optional(),
})

export const programInviteSchema = z.object({
  programAdmins: z.array(z.string()).optional(),
  programMembers: z.array(z.string()).optional(),
  viewerIDs: z.array(z.string()).optional(),
  editorIDs: z.array(z.string()).optional(),
})

export const step3Schema = z.object({
  programKindName: z.string({
    errorMap: (issue, ctx) => {
      if (issue.code === z.ZodIssueCode.invalid_type) {
        return { message: 'Choose how you want to get started' }
      }
      return { message: ctx.defaultError }
    },
  }),
})

export const fullSchema = step1Schema.merge(programInviteSchema).merge(step3Schema)
export type WizardValues = z.infer<typeof fullSchema>

export async function validateFullAndNotify(methods: UseFormReturn<WizardValues>, notify: (props: TErrorProps) => void): Promise<boolean> {
  const values = methods.getValues()
  const result = fullSchema.safeParse(values)

  if (!result.success) {
    const firstIssue = result.error.issues[0]
    if (firstIssue?.message) {
      notify({ title: 'Error', description: firstIssue.message })
    }
    return false
  }
  return true
}
