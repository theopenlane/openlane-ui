import {
  ACKNOWLEDGEMENT_SIGNATURE_METADATA_FIELD,
  ACKNOWLEDGEMENT_SIGNED_AT_FIELD,
  hasAcknowledgementFields,
  isAcknowledgementSigned,
  readAcknowledgementValue,
} from '@/components/shared/survey/acknowledgement/acknowledgement-type'
import { decodeQuestionnaireToken } from '@/lib/questionnaire-token'
import { getClientIp } from '@/lib/server/client-ip'
import { isRecord } from '@/utils/type-guards'

export type TAcknowledgementSignatureMetadata = {
  ipAddress: string
  userAgent: string
  timestamp: string
  tokenSubject?: string
  email?: string
  preview: boolean
}

const SERVER_STAMPED_FIELDS: ReadonlySet<string> = new Set([ACKNOWLEDGEMENT_SIGNED_AT_FIELD, ACKNOWLEDGEMENT_SIGNATURE_METADATA_FIELD])

export const buildSignatureMetadata = (req: Request, token: string): TAcknowledgementSignatureMetadata => {
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

const stampRecord = (record: Record<string, unknown>, metadata: TAcknowledgementSignatureMetadata | null): Record<string, unknown> => {
  const isAcknowledgement = hasAcknowledgementFields(record)
  const clientFields = Object.fromEntries(Object.entries(record).flatMap(([key, value]) => (isAcknowledgement && SERVER_STAMPED_FIELDS.has(key) ? [] : [[key, stampAnswer(value, metadata)]])))
  if (!metadata || !isAcknowledgementSigned(readAcknowledgementValue(record))) return clientFields
  return { ...clientFields, [ACKNOWLEDGEMENT_SIGNED_AT_FIELD]: metadata.timestamp, [ACKNOWLEDGEMENT_SIGNATURE_METADATA_FIELD]: metadata }
}

const stampAnswer = (value: unknown, metadata: TAcknowledgementSignatureMetadata | null): unknown => {
  if (Array.isArray(value)) return value.map((item) => stampAnswer(item, metadata))
  return isRecord(value) ? stampRecord(value, metadata) : value
}

export const withServerSignatureFields = (answers: Record<string, unknown>, metadata: TAcknowledgementSignatureMetadata | null): Record<string, unknown> =>
  Object.fromEntries(Object.entries(answers).map(([name, value]) => [name, stampAnswer(value, metadata)]))
