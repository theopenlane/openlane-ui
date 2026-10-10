import { createHash } from 'node:crypto'
import { isAcknowledgementSigned, readAcknowledgementValue } from '@/components/shared/survey/acknowledgement/acknowledgement-type'
import { isSignaturePadValue, SIGNATURE_METADATA_FIELD } from '@/components/shared/survey/signature-pad/signature-pad-type'
import { decodeQuestionnaireToken } from '@/lib/questionnaire-token'
import { getClientIp, getForwardedFor } from '@/lib/server/client-ip'
import { isRecord } from '@/utils/type-guards'

export type TSignatureMetadata = {
  ipAddress: string
  forwardedFor?: string
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
    forwardedFor: getForwardedFor(req),
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

const withAcknowledgementSignatureMetadata = (data: unknown, metadata: TSignatureMetadata | null): unknown => {
  if (Array.isArray(data)) return data.map((item) => withAcknowledgementSignatureMetadata(item, metadata))
  if (!isRecord(data)) return data
  const answer = mapAnswers(data, metadata)
  return isAcknowledgementSigned(readAcknowledgementValue(data)) ? stampSignatureMetadata(answer, metadata) : answer
}

const mapAnswers = (answers: TAnswers, metadata: TSignatureMetadata | null): TAnswers =>
  Object.fromEntries(Object.entries(answers).map(([key, value]) => [key, withAcknowledgementSignatureMetadata(value, metadata)]))

const isSignaturePadStamp = (value: unknown): boolean => isRecord(value) && typeof value.timestamp === 'string' && Array.isArray(value.signatures)

const withSignaturePadMetadata = (answers: TAnswers, metadata: TSignatureMetadata | null): TAnswers => {
  const existing = answers[SIGNATURE_METADATA_FIELD]
  if (existing !== undefined && !isSignaturePadStamp(existing)) return answers
  const signatures = Object.entries(answers).flatMap(([question, value]) => (isSignaturePadValue(value) ? [{ question, sha256: createHash('sha256').update(value).digest('hex') }] : []))
  return stampSignatureMetadata(answers, metadata && signatures.length ? { ...metadata, signatures } : null)
}

export const withSignatureMetadata = (answers: TAnswers, metadata: TSignatureMetadata | null): TAnswers => withSignaturePadMetadata(mapAnswers(answers, metadata), metadata)
