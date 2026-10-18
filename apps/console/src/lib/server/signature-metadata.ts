import { createHash } from 'node:crypto'
import { hasAcknowledgementFields } from '@/components/shared/survey/acknowledgement/acknowledgement-type'
import { hasSignatureFields, isSignedValue, readSignatureValue, SIGNATURE_SIGNED_AT_FIELD } from '@/components/shared/survey/signature/signature-type'
import { isSignaturePadValue, SIGNATURE_METADATA_FIELD } from '@/components/shared/survey/signature-pad/signature-pad-type'
import { decodeQuestionnaireToken } from '@/lib/questionnaire-token'
import { getClientIp } from '@/lib/server/client-ip'
import { isRecord } from '@/utils/type-guards'

export type TSignatureMetadata = {
  ipAddress: string
  userAgent: string
  timestamp: string
  tokenSubject?: string
  email?: string
  preview: boolean
}

type TAnswers = Record<string, unknown>

export const buildSignatureMetadata = (req: Request, token: string): TSignatureMetadata => {
  const claims = decodeQuestionnaireToken(token)
  return {
    ipAddress: getClientIp(req),
    userAgent: req.headers.get('user-agent') ?? 'unknown',
    timestamp: new Date().toISOString(),
    tokenSubject: claims?.user_id || undefined,
    email: claims?.email || undefined,
    preview: claims?.assessment_preview === true,
  }
}

type TSignedQuestion = {
  question: string
  sha256: string
}

type TSignaturePadMetadata = TSignatureMetadata & {
  signatures: TSignedQuestion[]
}

const stampSignatureMetadata = (record: TAnswers, metadata: TSignatureMetadata | TSignaturePadMetadata | null): TAnswers => {
  const stamped = { ...record }
  delete stamped[SIGNATURE_METADATA_FIELD]
  if (metadata) stamped[SIGNATURE_METADATA_FIELD] = metadata
  return stamped
}

const SERVER_STAMPED_FIELDS: ReadonlySet<string> = new Set([SIGNATURE_SIGNED_AT_FIELD, SIGNATURE_METADATA_FIELD])

const stampSignedRecord = (record: TAnswers, metadata: TSignatureMetadata | null): TAnswers => {
  const clientFields = Object.fromEntries(Object.entries(mapAnswers(record, metadata)).filter(([key]) => !SERVER_STAMPED_FIELDS.has(key)))
  if (!metadata || !isSignedValue(readSignatureValue(record))) return clientFields
  return { ...clientFields, [SIGNATURE_SIGNED_AT_FIELD]: metadata.timestamp, [SIGNATURE_METADATA_FIELD]: metadata }
}

const withSignedRecordMetadata = (data: unknown, metadata: TSignatureMetadata | null): unknown => {
  if (Array.isArray(data)) return data.map((item) => withSignedRecordMetadata(item, metadata))
  if (!isRecord(data)) return data
  return hasSignatureFields(data) || hasAcknowledgementFields(data) ? stampSignedRecord(data, metadata) : mapAnswers(data, metadata)
}

const mapAnswers = (answers: TAnswers, metadata: TSignatureMetadata | null): TAnswers =>
  Object.fromEntries(Object.entries(answers).map(([key, value]) => [key, withSignedRecordMetadata(value, metadata)]))

const isSignaturePadStamp = (value: unknown): boolean => isRecord(value) && typeof value.timestamp === 'string' && Array.isArray(value.signatures)

const withSignaturePadMetadata = (answers: TAnswers, metadata: TSignatureMetadata | null): TAnswers => {
  const existing = answers[SIGNATURE_METADATA_FIELD]
  if (existing !== undefined && !isSignaturePadStamp(existing)) return answers
  const signatures = Object.entries(answers).flatMap(([question, value]) => (isSignaturePadValue(value) ? [{ question, sha256: createHash('sha256').update(value).digest('hex') }] : []))
  return stampSignatureMetadata(answers, metadata && signatures.length ? { ...metadata, signatures } : null)
}

export const withSignatureMetadata = (answers: TAnswers, metadata: TSignatureMetadata | null): TAnswers => withSignaturePadMetadata(mapAnswers(answers, metadata), metadata)
