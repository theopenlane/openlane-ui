import { z } from 'zod'
import { type UseFormReturn } from 'react-hook-form'
import { type TErrorProps } from '@/hooks/useNotification'
import { type FrameworkControlCount, type SourceProgram } from './from-existing-types'

export const NO_FRAMEWORK_LABEL = 'Organization'

export const sourceProgramStepSchema = z.object({
  sourceProgramID: z.string({ required_error: 'Select a program to copy from' }).min(1, { message: 'Select a program to copy from' }),
})

export const detailsStepSchema = z.object({
  name: z.string().min(1, 'Program Name is required'),
  description: z.string().optional(),
  programKindName: z.string().optional(),
  framework: z.string().optional(),
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),
  programOwnerID: z.string().optional(),
})

export const auditorStepSchema = z.object({
  useSameAuditor: z.boolean().optional(),
  auditPartnerName: z.string().optional(),
  auditFirm: z.string().optional(),
  auditPartnerEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
})

export const teamStepSchema = z.object({
  programAdmins: z.array(z.string()).optional(),
  programMembers: z.array(z.string()).optional(),
  programAuditors: z.array(z.string()).optional(),
  editorIDs: z.array(z.string()).optional(),
  viewerIDs: z.array(z.string()).optional(),
  teamInitialized: z.boolean().optional(),
})

export const controlsStepSchema = z.object({
  controlIDs: z.array(z.string()).optional(),
  controlsInitialized: z.boolean().optional(),
})

const baseSchema = sourceProgramStepSchema.merge(detailsStepSchema).merge(auditorStepSchema).merge(teamStepSchema).merge(controlsStepSchema)

export const wizardSchema = baseSchema.superRefine((data, ctx) => {
  if (data.startDate && data.endDate && data.endDate <= data.startDate) {
    ctx.addIssue({
      path: ['endDate'],
      code: z.ZodIssueCode.custom,
      message: 'End date must be after start date',
    })
  }
})

export type WizardValues = z.infer<typeof wizardSchema>

type WizardField = keyof WizardValues

const stepSchemas = [sourceProgramStepSchema, detailsStepSchema, auditorStepSchema, teamStepSchema, controlsStepSchema]

export const stepIndexForField = (field: WizardField): number => stepSchemas.findIndex((schema) => field in schema.shape)

export const validateFullAndNotify = async (methods: UseFormReturn<WizardValues>, notify: (props: TErrorProps) => void): Promise<number | null> => {
  const valid = await methods.trigger()
  if (valid) return null

  const errorSteps = (Object.keys(methods.formState.errors) as WizardField[])
    .map((field) => ({ step: stepIndexForField(field), message: methods.formState.errors[field]?.message }))
    .filter((entry) => entry.step >= 0)
    .sort((a, b) => a.step - b.step)

  const first = errorSteps[0]
  if (first?.message) {
    notify({ title: 'Error', description: String(first.message) })
  }
  return first?.step ?? 0
}

export const groupControlsByFramework = <T extends { referenceFramework?: string | null }>(controls: T[]): Record<string, T[]> =>
  controls.reduce<Record<string, T[]>>((groups, control) => {
    const framework = control.referenceFramework || NO_FRAMEWORK_LABEL
    if (!groups[framework]) groups[framework] = []
    groups[framework].push(control)
    return groups
  }, {})

export const controlCountsByFramework = (controls: { referenceFramework?: string | null }[]): FrameworkControlCount[] =>
  Object.entries(groupControlsByFramework(controls))
    .map(([framework, grouped]) => ({ framework, count: grouped.length }))
    .sort((a, b) => a.framework.localeCompare(b.framework))

type AuditorFields = Pick<SourceProgram, 'auditor' | 'auditFirm' | 'auditorEmail'>

export const hasAuditorDetails = (program?: AuditorFields): boolean => !!(program?.auditor || program?.auditFirm || program?.auditorEmail)

export const auditorValuesFrom = (program?: AuditorFields) => ({
  auditPartnerName: program?.auditor ?? '',
  auditFirm: program?.auditFirm ?? '',
  auditPartnerEmail: program?.auditorEmail ?? '',
})

export const emptySelections = () => ({
  programAdmins: [],
  programMembers: [],
  programAuditors: [],
  editorIDs: [],
  viewerIDs: [],
  teamInitialized: false,
  controlIDs: [],
  controlsInitialized: false,
})

export const suggestedProgramName = (sourceName?: string | null): string => {
  const currentYear = new Date().getFullYear()
  const name = (sourceName ?? '').trim()

  if (!name) return `Program - ${currentYear} Copy`

  const withoutYear = name.replace(/[\s-]*\b(19|20)\d{2}\b(\s+Copy)?\s*$/i, '').trim()
  const rolledForward = withoutYear && withoutYear !== name ? withoutYear : name

  return `${rolledForward} - ${currentYear} Copy`
}
