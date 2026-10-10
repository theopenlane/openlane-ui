import { formatDateTime } from '@/utils/date'
import { isRecord } from '@/utils/type-guards'

export const ACKNOWLEDGEMENT_QUESTION_TYPE = 'acknowledgement'
export const DEFAULT_ACKNOWLEDGEMENT_TITLE = 'Acknowledgement'
export const DEFAULT_ACKNOWLEDGEMENT_STATEMENT = 'I acknowledge that I’ve read and understand the documents above.'

export const TYPED_SIGNATURE_PREFIX = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg data-signature-method="typed"')}`

export const isTypedSignature = (value: unknown): value is string => typeof value === 'string' && value.startsWith(TYPED_SIGNATURE_PREFIX)

export const ACKNOWLEDGEMENT_SIGNATURE_METADATA_FIELD = 'signatureMetadata'

export type TAcknowledgementValue = {
  acknowledged?: boolean
  fullName?: string
  signature?: string
  signedAt?: string
}

export const readAcknowledgementValue = (value: unknown): TAcknowledgementValue => {
  if (!isRecord(value)) return {}
  const { acknowledged, fullName, signature, signedAt } = value
  return {
    acknowledged: acknowledged === true,
    fullName: typeof fullName === 'string' ? fullName : undefined,
    signature: typeof signature === 'string' ? signature : undefined,
    signedAt: typeof signedAt === 'string' ? signedAt : undefined,
  }
}

export const isAcknowledgementSigned = ({ acknowledged, fullName, signature }: TAcknowledgementValue): boolean => Boolean(acknowledged && fullName?.trim() && signature)

export const renderAcknowledgementAnswer = (value: unknown): string => {
  const { acknowledged, fullName, signature, signedAt } = readAcknowledgementValue(value)
  if (!acknowledged) return 'Not acknowledged'
  if (!signature) return 'Acknowledged, not signed'
  const signer = fullName ? `Signed by ${fullName}` : 'Signed'
  return signedAt ? `${signer} on ${formatDateTime(signedAt)}` : signer
}
