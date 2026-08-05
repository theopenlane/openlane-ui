import { z } from 'zod'
import { type UseFormReturn } from 'react-hook-form'
import { type TErrorProps } from '@/hooks/useNotification'
import { type FrameworkControlCount, type SourceProgram } from './from-existing-types'

export const NO_FRAMEWORK_LABEL = 'Organization controls'

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

export const validateFullAndNotify = async (methods: UseFormReturn<WizardValues>, notify: (props: TErrorProps) => void): Promise<boolean> => {
  const result = wizardSchema.safeParse(methods.getValues())

  if (!result.success) {
    const firstIssue = result.error.issues[0]
    if (firstIssue?.message) {
      notify({ title: 'Error', description: firstIssue.message })
    }
    return false
  }

  return true
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

// auditorValuesFrom keeps the "use the same auditor" toggle and the initial prefill in sync,
// both fill the same three fields from the copied program or clear them
export const auditorValuesFrom = (program: AuditorFields | undefined, useSameAuditor: boolean) => ({
  auditPartnerName: useSameAuditor ? (program?.auditor ?? '') : '',
  auditFirm: useSameAuditor ? (program?.auditFirm ?? '') : '',
  auditPartnerEmail: useSameAuditor ? (program?.auditorEmail ?? '') : '',
})

// the team and control selections are filled in by their own effects once those queries settle
export const emptySelections = () => ({
  programAdmins: [],
  programMembers: [],
  editorIDs: [],
  viewerIDs: [],
  teamInitialized: false,
  controlIDs: [],
  controlsInitialized: false,
})

// suggestedProgramName rolls a program name forward to the current year so an annual
// program copied from last year's does not come back as "SOC 2 - 2025" again
export const suggestedProgramName = (sourceName?: string | null): string => {
  const currentYear = new Date().getFullYear()
  const name = (sourceName ?? '').trim()

  if (!name) return `Program - ${currentYear}`

  const withoutYear = name.replace(/[\s-]*\b(19|20)\d{2}\b\s*$/, '').trim()

  if (withoutYear && withoutYear !== name) return `${withoutYear} - ${currentYear}`

  return `${name} - ${currentYear}`
}
