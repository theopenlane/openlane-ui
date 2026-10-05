import { formatDateTime } from '@/utils/date'
import { isRecord } from '@/utils/type-guards'

export const ACKNOWLEDGEMENT_QUESTION_TYPE = 'acknowledgement'
export const DEFAULT_ACKNOWLEDGEMENT_TITLE = 'Acknowledgement'

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

export const renderAcknowledgementAnswer = (value: unknown): string => {
  const { acknowledged, fullName, signature, signedAt } = readAcknowledgementValue(value)
  if (!acknowledged) return 'Not acknowledged'
  if (!signature) return 'Acknowledged, not signed'
  const signer = fullName ? `Signed by ${fullName}` : 'Signed'
  return signedAt ? `${signer} on ${formatDateTime(signedAt)}` : signer
}
