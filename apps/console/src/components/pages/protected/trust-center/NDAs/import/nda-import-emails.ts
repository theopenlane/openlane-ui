import { type CreateTrustCenterNdaRequestInput } from '@repo/codegen/src/schema'
import type { TImportRecord } from '@/components/shared/record-import/lib/types'
import { normalizeFieldName } from '@/utils/strings'

const EMAIL_FIELD = normalizeFieldName('email' satisfies keyof CreateTrustCenterNdaRequestInput)

export const readImportEmails = (records: TImportRecord[]): string[] =>
  records.flatMap((record) => Object.entries(record).flatMap(([field, value]) => (normalizeFieldName(field) === EMAIL_FIELD && value?.trim() ? [value.trim()] : [])))
