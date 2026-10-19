import { PanelModel, QuestionCompositeModel, QuestionExpressionModel, QuestionSignaturePadModel, Serializer, type LocalizableString, type Question } from 'survey-core'
import { formatDate, formatDateTime } from '@/utils/date'
import { FULL_WIDTH_SIGNATURE_PAD, SIGNATURE_INK_COLOR, SIGNATURE_PAD_QUESTION_TYPE } from '../signature-pad/signature-pad-type'
import '../signature-pad/signature-pad-model'
import { isTypedSignature, SIGNATURE_SIGNED_AT_FIELD } from './signature-type'
import { renderTypedSignature, TYPED_SIGNATURE_STYLE_COUNT } from './typed-signature'
import './signature.css'

const SIGNED_AT_QUESTION_TYPE = 'signaturesignedat'
export const SIGNATURE_FIELD_TYPE = 'signaturefield'
export const SIGNATURE_QUESTION_ICON = 'icon-signaturepad'
const SIGNATURE_CSS_CLASS = 'ol-signature-field'
const SIGNED_AT_CSS_CLASS = 'ol-signature-signed-at'
const FULL_NAME_FIELD = 'fullName'
const SIGNATURE_FIELD = 'signature'
const SIGNING_FIELD_NAMES = [FULL_NAME_FIELD, SIGNATURE_FIELD] as const

type TSigningFieldName = (typeof SIGNING_FIELD_NAMES)[number]

class QuestionSignatureSignedAtModel extends QuestionExpressionModel {
  getType(): string {
    return SIGNED_AT_QUESTION_TYPE
  }

  getTemplate(): string {
    return 'expression'
  }

  protected getCssType(): string {
    return 'expression'
  }

  onSurveyLoad(): void {
    super.onSurveyLoad()
    this.updateFormatedValue()
  }

  protected onReadOnlyChanged(): void {
    super.onReadOnlyChanged()
    this.updateFormatedValue()
  }

  protected getDisplayValueCore(_keysAsText: boolean, value: string | undefined): string {
    if (value) return `Signed date: ${formatDateTime(value)}`
    if (this.isReadOnly && !this.isDesignMode) return ''
    return `Signed date: ${formatDate(new Date().toISOString())} · Filled automatically`
  }
}

Serializer.addClass(SIGNED_AT_QUESTION_TYPE, [], () => new QuestionSignatureSignedAtModel(''), 'expression')

const SIGNATURE_METHODS = ['typed', 'drawn'] as const

export type TSignatureMethod = (typeof SIGNATURE_METHODS)[number]

export const isSignatureMethod = (value: string): value is TSignatureMethod => SIGNATURE_METHODS.some((method) => method === value)

type TTypedSignatureStatus = 'idle' | 'rendering' | 'failed'

export class QuestionSignatureFieldModel extends QuestionSignaturePadModel {
  private typedStyleIndex = 0
  private typedRenderRequest = 0
  private stashedDrawnSignature: string | undefined

  getType(): string {
    return SIGNATURE_FIELD_TYPE
  }

  getTemplate(): string {
    return SIGNATURE_FIELD_TYPE
  }

  protected getCssType(): string {
    return SIGNATURE_PAD_QUESTION_TYPE
  }

  get locRenderedPlaceholder(): LocalizableString {
    return this.getLocalizableString(this.isSurveyReadOnly ? 'placeholderReadOnly' : 'placeholder')
  }

  get isSurveyReadOnly(): boolean {
    return !!this.parent?.isReadOnly
  }

  get signatureMethod(): TSignatureMethod {
    const chosen: TSignatureMethod | undefined = this.getPropertyValue('signatureMethod')
    return chosen ?? (this.isEmpty() || isTypedSignature(this.value) ? 'typed' : 'drawn')
  }

  get signerName(): string {
    const fullName = this.parent instanceof PanelModel ? this.parent.getQuestionByName(FULL_NAME_FIELD)?.value : undefined
    return typeof fullName === 'string' ? fullName.trim() : ''
  }

  get typedSignatureStatus(): TTypedSignatureStatus {
    return this.getPropertyValue('typedSignatureStatus', 'idle')
  }

  get canChangeSignature(): boolean {
    return !this.isReadOnly && !this.isDesignMode
  }

  selectSignatureMethod(method: TSignatureMethod) {
    if (!this.canChangeSignature || method === this.signatureMethod) return
    if (method === 'drawn') {
      this.cancelTypedRender()
      this.setPropertyValue('signatureMethod', method)
      this.value = this.stashedDrawnSignature
      return
    }
    if (!isTypedSignature(this.value)) this.stashedDrawnSignature = this.isEmpty() ? undefined : this.value
    this.setPropertyValue('signatureMethod', method)
    this.syncTypedSignature()
  }

  regenerateTypedSignature() {
    this.typedStyleIndex = (this.typedStyleIndex + 1) % TYPED_SIGNATURE_STYLE_COUNT
    this.syncTypedSignature()
  }

  syncTypedSignature() {
    if (!this.canChangeSignature || this.signatureMethod !== 'typed') return
    const name = this.signerName
    if (!name) {
      this.cancelTypedRender()
      this.clearValue()
      return
    }
    const request = ++this.typedRenderRequest
    this.setPropertyValue('typedSignatureStatus', 'rendering')
    this.value = undefined
    renderTypedSignature(name, this.typedStyleIndex, SIGNATURE_INK_COLOR).then(
      (signature) => this.finishTypedSignature(request, signature),
      () => this.finishTypedSignature(request, undefined),
    )
  }

  onSurveyValueChanged(newValue: string | undefined): void {
    super.onSurveyValueChanged(newValue)
    this.fillMissingTypedSignature()
  }

  protected onReadOnlyChanged(): void {
    super.onReadOnlyChanged()
    this.fillMissingTypedSignature()
  }

  private fillMissingTypedSignature() {
    if (this.isEmpty() && this.typedSignatureStatus === 'idle' && this.signerName) this.syncTypedSignature()
  }

  private cancelTypedRender() {
    this.typedRenderRequest++
    this.setPropertyValue('typedSignatureStatus', 'idle')
  }

  private finishTypedSignature(request: number, signature: string | undefined) {
    if (request !== this.typedRenderRequest || this.isDisposed) return
    if (!this.canChangeSignature) return this.cancelTypedRender()
    this.setPropertyValue('typedSignatureStatus', signature ? 'idle' : 'failed')
    this.value = signature
  }
}

Serializer.addClass(SIGNATURE_FIELD_TYPE, [], () => new QuestionSignatureFieldModel(''), SIGNATURE_PAD_QUESTION_TYPE)

export const SIGNING_ELEMENTS_JSON = [
  { type: 'text', name: FULL_NAME_FIELD, title: 'Full Name', autocomplete: 'name' },
  {
    type: SIGNATURE_FIELD_TYPE,
    name: SIGNATURE_FIELD,
    title: 'Signature',
    placeholder: 'Sign here',
    placeholderReadOnly: 'Not signed',
    ...FULL_WIDTH_SIGNATURE_PAD,
    dataFormat: 'svg',
    penColor: SIGNATURE_INK_COLOR,
  },
  { type: SIGNED_AT_QUESTION_TYPE, name: SIGNATURE_SIGNED_AT_FIELD, titleLocation: 'hidden' },
]

export const compositeField = (question: Question, name: string) => (question instanceof QuestionCompositeModel ? question.contentPanel.getQuestionByName(name) : null)

export const signingFields = (question: Question) => SIGNING_FIELD_NAMES.flatMap((name) => compositeField(question, name) ?? [])

export const applySigningRequired = (question: Question, conditionFor: (fieldName: TSigningFieldName) => string) => {
  SIGNING_FIELD_NAMES.forEach((name) => {
    const field = compositeField(question, name)
    if (!field) return
    field.requiredIf = question.isRequired ? '' : conditionFor(name)
    field.isRequired = question.isRequired
  })
}

const REQUIRED_WHEN_OTHER_FILLED: Record<TSigningFieldName, string> = {
  [FULL_NAME_FIELD]: `{composite.${SIGNATURE_FIELD}} notempty`,
  [SIGNATURE_FIELD]: `{composite.${FULL_NAME_FIELD}} notempty`,
}

export const requiredWhenOtherSigningFieldFilled = (fieldName: TSigningFieldName) => REQUIRED_WHEN_OTHER_FILLED[fieldName]

const syncTypedSignature = (question: Question) => {
  const signature = compositeField(question, SIGNATURE_FIELD)
  if (signature instanceof QuestionSignatureFieldModel) signature.syncTypedSignature()
}

const recordSignedAt = (question: Question, isSigned: (question: Question) => boolean) => {
  const signedAt = compositeField(question, SIGNATURE_SIGNED_AT_FIELD)
  if (!signedAt) return
  if (isSigned(question)) signedAt.value = new Date().toISOString()
  else if (!signedAt.isEmpty()) signedAt.clearValue()
}

const handleSigningValueChanged = (question: Question, name: string, isSigned: (question: Question) => boolean) => {
  if (question.isReadOnly || question.isDesignMode) return
  if (name === FULL_NAME_FIELD) syncTypedSignature(question)
  if (name !== SIGNATURE_SIGNED_AT_FIELD) recordSignedAt(question, isSigned)
}

const addSigningCssClasses = (element: Question, cssClasses: { root: string }) => {
  if (element instanceof QuestionSignatureFieldModel) cssClasses.root = `${cssClasses.root} ${SIGNATURE_CSS_CLASS}`
  if (element instanceof QuestionSignatureSignedAtModel) cssClasses.root = `${cssClasses.root} ${SIGNED_AT_CSS_CLASS}`
}

export const signingCompositeHandlers = (isSigned: (question: Question) => boolean) => ({
  onUpdateQuestionCssClasses(_question: Question, element: Question, cssClasses: { root: string }) {
    addSigningCssClasses(element, cssClasses)
  },
  onValueChanged(question: Question, name: string) {
    handleSigningValueChanged(question, name, isSigned)
  },
})
