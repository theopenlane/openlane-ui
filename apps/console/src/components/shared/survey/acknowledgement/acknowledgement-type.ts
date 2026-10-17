import { isRecord } from '@/utils/type-guards'
import { describeSignature, isSignedValue, readSignatureValue, type TSignatureValue } from '../signature/signature-type'

export const ACKNOWLEDGEMENT_QUESTION_TYPE = 'acknowledgement'
export const DEFAULT_ACKNOWLEDGEMENT_TITLE = 'Acknowledgement'
export const DEFAULT_ACKNOWLEDGEMENT_STATEMENT = 'I acknowledge that I’ve read and understand the documents above.'

export type TAcknowledgementValue = TSignatureValue & {
  acknowledged?: boolean
}

export const ACKNOWLEDGED_FIELD = 'acknowledged' satisfies keyof TAcknowledgementValue

export const hasAcknowledgementFields = (record: Record<string, unknown>): boolean => Object.hasOwn(record, ACKNOWLEDGED_FIELD)

export const readAcknowledgementValue = (value: unknown): TAcknowledgementValue => (isRecord(value) ? { ...readSignatureValue(value), acknowledged: value.acknowledged === true } : {})

export const isAcknowledgementSigned = (value: TAcknowledgementValue): boolean => !!value.acknowledged && isSignedValue(value)

export const renderAcknowledgementAnswer = (value: unknown): string => {
  const acknowledgement = readAcknowledgementValue(value)
  if (!acknowledgement.acknowledged) return 'Not acknowledged'
  if (!isSignedValue(acknowledgement)) return 'Acknowledged, not signed'
  return describeSignature(acknowledgement)
}
