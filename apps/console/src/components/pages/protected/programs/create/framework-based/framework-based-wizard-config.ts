import { type TErrorProps } from '@/hooks/useNotification'
import { z } from 'zod'
import { type UseFormReturn } from 'react-hook-form'
import { suggestedControlsStepSchema } from '../shared/suggested-controls-schema'

export const selectFrameworkSchema = z.object({
  framework: z.string({ error: (issue) => (issue.input === undefined ? 'Framework is required' : undefined) }).min(1, { message: 'Framework is required' }),
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
    error: (issue) => (issue.input === undefined ? 'Please choose a program type' : undefined),
  }),
})

export const categoriesStepSchema = z.object({
  categories: z.array(z.string()),
})

export const wizardSchema = selectFrameworkSchema.merge(programInviteSchema).merge(categoriesStepSchema).merge(suggestedControlsStepSchema).merge(programTypeSchema)

export type WizardValues = z.infer<typeof wizardSchema>

export const validateFullAndNotify = async (methods: UseFormReturn<WizardValues>, notify: (props: TErrorProps) => void): Promise<boolean> => {
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
