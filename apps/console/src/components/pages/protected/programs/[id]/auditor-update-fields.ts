import { z } from 'zod'
import { type UpdateProgramInput } from '@repo/codegen/src/schema'
import { orClear, type TFieldMappers } from '@/hooks/useDirtyInput'

export const setAuditorSchema = z.object({
  auditor: z.string().optional().nullable(),
  auditorEmail: z.string().optional().nullable(),
  auditFirm: z.string().optional(),
})

export type SetAuditorFormValues = z.infer<typeof setAuditorSchema>

export const toAuditorFormValues = (program: { auditor?: string | null; auditorEmail?: string | null; auditFirm?: string | null } | undefined): SetAuditorFormValues => ({
  auditor: program?.auditor ?? '',
  auditorEmail: program?.auditorEmail ?? '',
  auditFirm: program?.auditFirm ?? '',
})

export const AUDITOR_UPDATE_FIELDS = {
  auditor: orClear('clearAuditor'),
  auditorEmail: orClear('clearAuditorEmail'),
  auditFirm: orClear('clearAuditFirm'),
} satisfies TFieldMappers<SetAuditorFormValues, UpdateProgramInput>
