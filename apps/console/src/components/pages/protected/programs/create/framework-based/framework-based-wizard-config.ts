// framework-based-wizard-config.ts
import { TErrorProps } from '@/hooks/useNotification'
import { z } from 'zod'
import { UseFormReturn } from 'react-hook-form'

export const selectFrameworkSchema = z.object({
  framework: z.string({ required_error: 'Framework is required' }).min(1, { message: 'Framework is required' }),
  standardID: z.string().optional(),
  name: z.string().optional(),
})

export const programInviteSchema = z.object({
  programAdmins: z.array(z.string()).optional(),
  programMembers: z.array(z.string()).optional(),
  viewerIDs: z.array(z.string()).optional(),
  editorIDs: z.array(z.string()).optional(),
})

export const programTypeSchema = z.object({
  programKindName: z.string({
    required_error: 'Please choose a program type',
  }),
})

export const categoriesStepSchema = z.object({
  categories: z.array(z.string()),
})

export const wizardSchema = selectFrameworkSchema.merge(programInviteSchema).merge(categoriesStepSchema).merge(programTypeSchema)

export type WizardValues = z.infer<typeof wizardSchema>

export async function validateFullAndNotify(methods: UseFormReturn<WizardValues>, notify: (props: TErrorProps) => void): Promise<boolean> {
  const values = methods.getValues()
  const result = wizardSchema.safeParse(values)

  if (!result.success) {
    const firstIssue = result.error.issues[0]
    if (firstIssue?.message) {
      notify({ title: 'Error', description: firstIssue.message })
    }
    return false
  }

  return true
}
