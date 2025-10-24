import { ProgramProgramType } from '@repo/codegen/src/schema'
import { z } from 'zod'
import { FieldValues, UseFormReturn, Path } from 'react-hook-form'
import { TErrorProps } from '@/hooks/useNotification'

export const categoriesStepSchema = z.object({
  categories: z.array(z.string()),
})

export const step1Schema = z.object({
  programType: z.nativeEnum(ProgramProgramType, {
    required_error: 'Please select a program type',
  }),
})

export const step2Schema = z
  .object({
    name: z.string().min(1, 'Program Name is required'),
    description: z.string().optional(),
    startDate: z.date().min(new Date(), { message: 'Start date must be in the future' }).optional(),
    endDate: z.date().min(new Date(), { message: 'End date must be after start date' }).optional(),
    framework: z.string().optional(),
    standardID: z.string().optional(),
    programType: z.nativeEnum(ProgramProgramType).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.programType === ProgramProgramType.FRAMEWORK && !data.framework) {
      ctx.addIssue({
        path: ['framework'],
        code: z.ZodIssueCode.custom,
        message: 'Framework is required when program type is Framework',
      })
    }
  })

export const step3Schema = z.object({
  auditPartnerName: z.string().optional(),
  auditFirm: z.string().optional(),
  auditPartnerEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
})

export const memberUserSchema = z
  .object({
    id: z.string(),
    displayName: z.string(),
    authProvider: z.string().optional(),
    avatarRemoteURL: z.string().nullable().optional(),
    email: z.string().email().optional(),
    role: z.string().optional(),
    createdAt: z.string().optional(),
    avatarFile: z.any().nullable().optional(),
  })
  .passthrough()

export const userSchema = z
  .object({
    id: z.string(),
    createdAt: z.string().optional(),
    role: z.string(),
    user: memberUserSchema,
  })
  .passthrough()

export const groupMemberSchema = z.object({
  node: z.object({
    id: z.string(),
    role: z.string(),
    user: memberUserSchema,
  }),
})

export const groupSchema = z
  .object({
    id: z.string(),
    description: z.string().nullable().optional(),
    name: z.string(),
    gravatarLogoURL: z.string().nullable().optional(),
    logoURL: z.string().nullable().optional(),
    members: z
      .object({
        edges: z.array(groupMemberSchema),
      })
      .optional(),
    setting: z
      .object({
        visibility: z.string().optional(),
        joinPolicy: z.string().optional(),
        syncToSlack: z.boolean().optional(),
        syncToGithub: z.boolean().optional(),
        id: z.string().optional(),
      })
      .optional(),
    updatedAt: z.string().optional(),
    updatedBy: z.string().optional(),
    createdAt: z.string().optional(),
    createdBy: z.string().optional(),
  })
  .passthrough()

export const step4Schema = z.object({
  programAdmins: z.array(userSchema).optional(),
  programMembers: z.array(userSchema).optional(),
  editAccessGroups: z.array(groupSchema).optional(),
  readOnlyGroups: z.array(groupSchema).optional(),
})

const optionSchema = z.object({
  label: z.string(),
  value: z.string(),
})

export const step5Schema = z.object({
  riskIDs: z.array(optionSchema).optional(),
  internalPolicyIDs: z.array(optionSchema).optional(),
  procedureIDs: z.array(optionSchema).optional(),
})

export const fullSchema = categoriesStepSchema.merge(step1Schema).merge(step3Schema).merge(step4Schema).merge(step5Schema).and(step2Schema)

export type WizardValues = z.infer<typeof fullSchema>

export async function validateStepAndNotify<T extends FieldValues>(methods: UseFormReturn<T>, stepId: string, notify: (props: TErrorProps) => void): Promise<boolean> {
  const stepFieldMap: Record<string, Path<T>> = {
    '0': 'programType' as Path<T>,
  }

  const field = stepFieldMap[stepId]

  const isValid = field ? await methods.trigger(field) : await methods.trigger()
  if (isValid) return true

  if (field) {
    const { error } = methods.getFieldState(field)
    if (error?.message) notify({ title: 'Error', description: error.message })
  }
  return false
}

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
