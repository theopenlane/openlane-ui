import { formatDateTime } from '@/utils/date'
import { isRecord } from '@/utils/type-guards'

export const SIGNATURE_QUESTION_TYPE = 'signature'
export const DEFAULT_SIGNATURE_TITLE = 'Signature'

export const TYPED_SIGNATURE_PREFIX = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg data-signature-method="typed"')}`

export const isTypedSignature = (value: unknown): value is string => typeof value === 'string' && value.startsWith(TYPED_SIGNATURE_PREFIX)

export type TSignatureValue = {
  fullName?: string
  signature?: string
  signedAt?: string
}

export const readSignatureValue = (value: unknown): TSignatureValue => {
  if (!isRecord(value)) return {}
  const { fullName, signature, signedAt } = value
  return {
    fullName: typeof fullName === 'string' ? fullName : undefined,
    signature: typeof signature === 'string' ? signature : undefined,
    signedAt: typeof signedAt === 'string' ? signedAt : undefined,
  }
}

export const isSignedValue = ({ fullName, signature }: TSignatureValue): boolean => !!fullName?.trim() && !!signature

export const describeSignature = (value: TSignatureValue): string => {
  if (!isSignedValue(value)) return 'Not signed'
  const signer = `Signed by ${value.fullName?.trim()}`
  const hasSignedDate = !!value.signedAt && !Number.isNaN(Date.parse(value.signedAt))
  return hasSignedDate ? `${signer} on ${formatDateTime(value.signedAt)}` : signer
}

export const renderSignatureAnswer = (value: unknown): string => describeSignature(readSignatureValue(value))
