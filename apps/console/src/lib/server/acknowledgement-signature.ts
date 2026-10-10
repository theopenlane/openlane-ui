import { ACKNOWLEDGEMENT_SIGNATURE_METADATA_FIELD, isAcknowledgementSigned, readAcknowledgementValue } from '@/components/shared/survey/acknowledgement/acknowledgement-type'
import { decodeQuestionnaireToken } from '@/lib/questionnaire-token'
import { getClientIp, getForwardedFor } from '@/lib/server/client-ip'
import { isRecord } from '@/utils/type-guards'

export type TAcknowledgementSignatureMetadata = {
  ipAddress: string
  forwardedFor?: string
  userAgent: string
  timestamp: string
  tokenSubject?: string
  email?: string
  preview: boolean
}

export const buildSignatureMetadata = (req: Request, token: string): TAcknowledgementSignatureMetadata => {
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

export const withAcknowledgementSignatureMetadata = (data: unknown, metadata: TAcknowledgementSignatureMetadata | null): unknown => {
  if (Array.isArray(data)) return data.map((item) => withAcknowledgementSignatureMetadata(item, metadata))
  if (!isRecord(data)) return data
  const isSignedAcknowledgement = isAcknowledgementSigned(readAcknowledgementValue(data))
  const answer = Object.fromEntries(
    Object.entries(data).flatMap(([key, value]) => (isSignedAcknowledgement && key === ACKNOWLEDGEMENT_SIGNATURE_METADATA_FIELD ? [] : [[key, withAcknowledgementSignatureMetadata(value, metadata)]])),
  )
  return isSignedAcknowledgement && metadata ? { ...answer, [ACKNOWLEDGEMENT_SIGNATURE_METADATA_FIELD]: metadata } : answer
}
