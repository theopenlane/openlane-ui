import { ProgramProgramType } from '@repo/codegen/src/schema'
import { z } from 'zod'
import { FieldValues, UseFormReturn, Path } from 'react-hook-form'
import { TErrorProps } from '@/hooks/useNotification'

export const step1Schema = z.object({
  categories: z.array(z.string()).min(1, 'You need to choose at least one category'),
})

export const programInviteSchema = z.object({
  programAdmins: z.array(z.string()).optional(),
  programMembers: z.array(z.string()).optional(),
  groupEditors: z.array(z.string()).optional(),
  groupViewers: z.array(z.string()).optional(),
})

export const step3Schema = z.object({
  programType: z.nativeEnum(ProgramProgramType, {
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

export async function validateStepAndNotify<T extends FieldValues>(methods: UseFormReturn<T>, stepId: string, notify: (props: TErrorProps) => void, validateAll = false): Promise<boolean> {
  const stepFieldMap: Record<string, Path<T>> = {
    '0': 'categories' as Path<T>,
    '2': 'programType' as Path<T>,
  }

  const fieldName = stepFieldMap[stepId]

  const isValid = validateAll ? await methods.trigger() : fieldName ? await methods.trigger(fieldName) : true

  if (isValid) return true

  if (validateAll) {
    const [firstErrorKey] = Object.keys(methods.formState.errors) as Path<T>[]
    if (firstErrorKey) {
      const { error } = methods.getFieldState(firstErrorKey)
      if (error?.message) notify({ title: 'Greška', description: error.message })
    }
    return false
  }

  if (fieldName) {
    const { error } = methods.getFieldState(fieldName)
    if (error?.message) notify({ title: 'Greška', description: error.message })
  }

  return false
}

export async function validateFullAndNotify(methods: UseFormReturn<WizardValues>, notify: (props: TErrorProps) => void): Promise<boolean> {
  const values = methods.getValues()
  const result = fullSchema.safeParse(values)

  if (!result.success) {
    const firstIssue = result.error.issues[0]
    if (firstIssue?.message) {
      notify({ title: 'Greška', description: firstIssue.message })
    }
    return false
  }
  return true
}
