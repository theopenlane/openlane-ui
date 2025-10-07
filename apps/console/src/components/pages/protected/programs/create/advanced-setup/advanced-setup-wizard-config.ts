import { ProgramProgramType } from '@repo/codegen/src/schema'
import { z } from 'zod'

export const step1Schema = z.object({
  programType: z
    .nativeEnum(ProgramProgramType, {
      required_error: 'Please select a program type',
    })
    .optional(),
})

export const step2Schema = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    startDate: z.date().min(new Date(), { message: 'Start date must be in the future' }).optional(),
    endDate: z.date().min(new Date(), { message: 'End date must be after start date' }).optional(),
    framework: z.string().optional(),
    standardID: z.string().optional(),
    programType: z.nativeEnum(ProgramProgramType),
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

export const step4Schema = z.object({
  programAdmins: z.array(z.string()).optional(),
  programMembers: z.array(z.string()).optional(),
  editAccessGroups: z.array(z.string()).optional(),
  readOnlyGroups: z.array(z.string()).optional(),
})

export const step5Schema = z.object({
  riskIDs: z.array(z.string()).optional(),
  internalPolicyIDs: z.array(z.string()).optional(),
  procedureIDs: z.array(z.string()).optional(),
})

export const fullSchema = step1Schema.merge(step3Schema).merge(step4Schema).merge(step5Schema).and(step2Schema)

export type WizardValues = z.infer<typeof fullSchema>
