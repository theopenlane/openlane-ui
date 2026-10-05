import { ComponentCollection, QuestionCompositeModel, QuestionExpressionModel, QuestionSignaturePadModel, Serializer, type LocalizableString, type Question } from 'survey-core'
import { formatDate, formatDateTime } from '@/utils/date'
import { ACKNOWLEDGEMENT_QUESTION_TYPE, DEFAULT_ACKNOWLEDGEMENT_TITLE, readAcknowledgementValue } from './acknowledgement-type'
import './acknowledgement.css'

const DEFAULT_ACKNOWLEDGEMENT_STATEMENT = 'I acknowledge that I’ve read and understand the documents above.'
const ACKNOWLEDGEMENT_REQUIRED_MESSAGE = 'Check the box to confirm the acknowledgement.'

const SIGNED_AT_QUESTION_TYPE = 'acknowledgementsignedat'
const SIGNATURE_QUESTION_TYPE = 'acknowledgementsignature'
const SIGNATURE_CSS_CLASS = 'ol-acknowledgement-signature'
const SIGNATURE_INK_COLOR = '#000000'
const SIGNED_AT_CSS_CLASS = 'ol-acknowledgement-signed-at'
const ACKNOWLEDGED_FIELD = 'acknowledged'
const FULL_NAME_FIELD = 'fullName'
const SIGNATURE_FIELD = 'signature'
const SIGNED_AT_FIELD = 'signedAt'
const SIGNING_FIELDS = [FULL_NAME_FIELD, SIGNATURE_FIELD]
const ACKNOWLEDGED_CONDITION = `{composite.${ACKNOWLEDGED_FIELD}} = true`

class QuestionAcknowledgementSignedAtModel extends QuestionExpressionModel {
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

Serializer.addClass(SIGNED_AT_QUESTION_TYPE, [], () => new QuestionAcknowledgementSignedAtModel(''), 'expression')

class QuestionAcknowledgementSignatureModel extends QuestionSignaturePadModel {
  getType(): string {
    return SIGNATURE_QUESTION_TYPE
  }

  getTemplate(): string {
    return 'signaturepad'
  }

  protected getCssType(): string {
    return 'signaturepad'
  }

  get locRenderedPlaceholder(): LocalizableString {
    return this.getLocalizableString(this.parent?.isReadOnly ? 'placeholderReadOnly' : 'placeholder')
  }
}

Serializer.addClass(SIGNATURE_QUESTION_TYPE, [], () => new QuestionAcknowledgementSignatureModel(''), 'signaturepad')

const contentQuestion = (question: Question, name: string) => (question instanceof QuestionCompositeModel ? question.contentPanel.getQuestionByName(name) : null)

const applyStatement = (question: Question) => {
  const checkbox = contentQuestion(question, ACKNOWLEDGED_FIELD)
  if (checkbox) checkbox.title = question.getPropertyValue('statement')
}

const signingFields = (question: Question) => SIGNING_FIELDS.flatMap((name) => contentQuestion(question, name) ?? [])

const applyRequired = (question: Question) => {
  signingFields(question).forEach((field) => {
    field.requiredIf = question.isRequired ? '' : ACKNOWLEDGED_CONDITION
    field.isRequired = question.isRequired
  })
}

const applyLock = (question: Question) => {
  const enableIf = question.getPropertyValue('lockUntilAcknowledged') ? ACKNOWLEDGED_CONDITION : ''
  signingFields(question).forEach((field) => {
    field.enableIf = enableIf
  })
}

const PROPERTY_APPLIERS: Record<string, (question: Question) => void> = {
  statement: applyStatement,
  isRequired: applyRequired,
  lockUntilAcknowledged: applyLock,
}

const recordSignedAt = (question: Question) => {
  const signedAt = contentQuestion(question, SIGNED_AT_FIELD)
  if (!signedAt) return
  const { acknowledged, fullName, signature } = readAcknowledgementValue(question.value)
  if (acknowledged && fullName?.trim() && signature) signedAt.value = new Date().toISOString()
  else if (!signedAt.isEmpty()) signedAt.clearValue()
}

if (!ComponentCollection.Instance.getCustomQuestionByName(ACKNOWLEDGEMENT_QUESTION_TYPE)) {
  ComponentCollection.Instance.add({
    name: ACKNOWLEDGEMENT_QUESTION_TYPE,
    title: DEFAULT_ACKNOWLEDGEMENT_TITLE,
    defaultQuestionTitle: DEFAULT_ACKNOWLEDGEMENT_TITLE,
    onInit() {
      Serializer.addProperties(ACKNOWLEDGEMENT_QUESTION_TYPE, [
        { name: 'statement:text', default: DEFAULT_ACKNOWLEDGEMENT_STATEMENT, category: 'general', visibleIndex: 3 },
        { name: 'lockUntilAcknowledged:switch', default: true, category: 'general', visibleIndex: 4 },
        { name: 'isRequired:switch', default: true, overridingProperty: 'requiredIf' },
      ])
    },
    elementsJSON: [
      { type: 'boolean', name: ACKNOWLEDGED_FIELD, displayMode: 'checkbox' },
      { type: 'text', name: FULL_NAME_FIELD, title: 'Full Name', autocomplete: 'name' },
      {
        type: SIGNATURE_QUESTION_TYPE,
        name: SIGNATURE_FIELD,
        title: 'Signature',
        placeholder: 'Sign here',
        placeholderReadOnly: 'Not signed',
        signatureWidth: 600,
        signatureHeight: 200,
        signatureAutoScaleEnabled: true,
        dataFormat: 'svg',
        penColor: SIGNATURE_INK_COLOR,
      },
      { type: SIGNED_AT_QUESTION_TYPE, name: SIGNED_AT_FIELD, titleLocation: 'hidden' },
    ],
    onUpdateQuestionCssClasses(_question, element, cssClasses) {
      if (element instanceof QuestionAcknowledgementSignatureModel) cssClasses.root = `${cssClasses.root} ${SIGNATURE_CSS_CLASS}`
      if (element instanceof QuestionAcknowledgementSignedAtModel) cssClasses.root = `${cssClasses.root} ${SIGNED_AT_CSS_CLASS}`
    },
    onCreated(question) {
      question.locRequiredErrorText.defaultValue = ACKNOWLEDGEMENT_REQUIRED_MESSAGE
    },
    onLoaded(question) {
      Object.values(PROPERTY_APPLIERS).forEach((apply) => apply(question))
    },
    onPropertyChanged(question, propertyName) {
      PROPERTY_APPLIERS[propertyName]?.(question)
    },
    onValueChanging(_question, name, newValue) {
      return name === ACKNOWLEDGED_FIELD && newValue !== true ? undefined : newValue
    },
    onValueChanged(question, name) {
      if (name !== SIGNED_AT_FIELD && !question.isReadOnly && !question.isDesignMode) recordSignedAt(question)
    },
    getErrorText(question) {
      return !question.isEmpty() && !readAcknowledgementValue(question.value).acknowledged ? ACKNOWLEDGEMENT_REQUIRED_MESSAGE : ''
    },
  })
}
