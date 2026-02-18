import { z } from 'zod'
import { UseFormReturn } from 'react-hook-form'
import { TErrorProps } from '@/hooks/useNotification'

export const categoriesStepSchema = z.object({
  categories: z.array(z.string()),
})

export const step1Schema = z.object({
  programKindName: z.string({
    required_error: 'Please select a program type',
  }),
})

export const step2Schema = z
  .object({
    name: z.string().min(1, 'Program Name is required'),
    description: z.string().optional(),
    startDate: z.date().nullable().optional(),
    endDate: z.date().nullable().optional(),
    framework: z.string().optional(),
    standardID: z.string().optional(),
    programKindName: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const now = new Date()

    // ✅ Framework requirement
    if (data.programKindName === 'Framework' && !data.framework) {
      ctx.addIssue({
        path: ['framework'],
        code: z.ZodIssueCode.custom,
        message: 'Framework is required when program type is Framework',
      })
    }

    if (data.endDate && data.endDate < now) {
      ctx.addIssue({
        path: ['endDate'],
        code: z.ZodIssueCode.custom,
        message: 'End date must be in the future',
      })
    }

    if (data.startDate && data.endDate && data.endDate <= data.startDate) {
      ctx.addIssue({
        path: ['endDate'],
        code: z.ZodIssueCode.custom,
        message: 'End date must be after start date',
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
    displayName: z.string().nullable().optional(),
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

export async function validateStepAndNotify(methods: UseFormReturn<WizardValues>, stepId: string, notify: (props: TErrorProps) => void): Promise<boolean> {
  let isValid = false

  if (stepId === '0') {
    isValid = await methods.trigger('programKindName')
  } else if (stepId === '1') {
    isValid = await methods.trigger(['name', 'startDate', 'endDate', 'framework'])
  } else if (stepId === '2') {
    isValid = await methods.trigger('categories')
  } else if (stepId === '3') {
    isValid = await methods.trigger('auditPartnerEmail')
  } else {
    isValid = await methods.trigger()
  }

  if (isValid) return true

  const firstError = Object.values(methods.formState.errors)[0]
  if (firstError && 'message' in firstError && firstError.message) {
    notify({ title: 'Error', description: String(firstError.message) })
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
