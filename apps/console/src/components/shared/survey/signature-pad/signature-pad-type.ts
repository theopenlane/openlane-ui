import type { QuestionSignaturePadModel } from 'survey-core'

export const SIGNATURE_PAD_QUESTION_TYPE = 'signaturepad'
export const SIGNATURE_PAD_WIDTH = 600
export const SIGNATURE_PAD_HEIGHT = 200
export const SIGNATURE_METADATA_FIELD = 'signatureMetadata'

export const FULL_WIDTH_SIGNATURE_PAD = {
  signatureWidth: SIGNATURE_PAD_WIDTH,
  signatureHeight: SIGNATURE_PAD_HEIGHT,
  signatureAutoScaleEnabled: true,
} satisfies Partial<Pick<QuestionSignaturePadModel, 'signatureWidth' | 'signatureHeight' | 'signatureAutoScaleEnabled'>>

const SIGNATURE_PAD_DATA_URL = /^data:image\/(png|jpeg|svg\+xml);base64,/

export const isSignaturePadValue = (value: unknown): value is string => typeof value === 'string' && SIGNATURE_PAD_DATA_URL.test(value)

export const renderSignaturePadAnswer = (value: unknown): string => (typeof value === 'string' && value ? 'Signed' : 'Not signed')
