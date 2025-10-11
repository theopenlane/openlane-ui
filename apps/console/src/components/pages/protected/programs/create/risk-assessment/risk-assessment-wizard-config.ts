import { ProgramProgramType } from '@repo/codegen/src/schema'
import { z } from 'zod'
export const selectFrameworkSchema = z.object({
  framework: z.string().optional(),
  standardID: z.string().optional(),
  name: z.string().optional(),
  programType: z.nativeEnum(ProgramProgramType).optional(),
})

export const programInviteSchema = z.object({
  programAdmins: z.array(z.string()).optional(),
  programMembers: z.array(z.string()).optional(),
  groupEditors: z.array(z.string()).optional(),
  groupViewers: z.array(z.string()).optional(),
})

export const step3Schema = z.object({
  riskIDs: z.array(z.string()).optional(),
})

export const wizardSchema = selectFrameworkSchema.merge(programInviteSchema).merge(step3Schema)

export type WizardValues = z.infer<typeof wizardSchema>
