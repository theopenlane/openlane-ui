import { ComponentCollection, Serializer, type Question } from 'survey-core'
import { applySigningRequired, compositeField, SIGNATURE_QUESTION_ICON, SIGNING_ELEMENTS_JSON, signingCompositeHandlers, signingFields } from '../signature/signature-field-model'
import { ACKNOWLEDGEMENT_QUESTION_TYPE, DEFAULT_ACKNOWLEDGEMENT_STATEMENT, DEFAULT_ACKNOWLEDGEMENT_TITLE, isAcknowledgementSigned, readAcknowledgementValue } from './acknowledgement-type'

const ACKNOWLEDGEMENT_REQUIRED_MESSAGE = 'Check the box to confirm the acknowledgement.'

const ACKNOWLEDGED_FIELD = 'acknowledged'
const ACKNOWLEDGED_CONDITION = `{composite.${ACKNOWLEDGED_FIELD}} = true`

const applyStatement = (question: Question) => {
  const checkbox = compositeField(question, ACKNOWLEDGED_FIELD)
  if (checkbox) checkbox.title = question.getPropertyValue('statement')
}

const applyRequired = (question: Question) => applySigningRequired(question, () => ACKNOWLEDGED_CONDITION)

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

const isSignedAcknowledgement = (question: Question) => isAcknowledgementSigned(readAcknowledgementValue(question.value))

if (!ComponentCollection.Instance.getCustomQuestionByName(ACKNOWLEDGEMENT_QUESTION_TYPE)) {
  ComponentCollection.Instance.add({
    name: ACKNOWLEDGEMENT_QUESTION_TYPE,
    title: DEFAULT_ACKNOWLEDGEMENT_TITLE,
    defaultQuestionTitle: DEFAULT_ACKNOWLEDGEMENT_TITLE,
    iconName: SIGNATURE_QUESTION_ICON,
    onInit() {
      Serializer.addProperties(ACKNOWLEDGEMENT_QUESTION_TYPE, [
        { name: 'statement:text', default: DEFAULT_ACKNOWLEDGEMENT_STATEMENT, category: 'general', visibleIndex: 3 },
        { name: 'lockUntilAcknowledged:switch', default: true, category: 'general', visibleIndex: 4 },
        { name: 'isRequired:switch', default: true, overridingProperty: 'requiredIf' },
      ])
    },
    elementsJSON: [{ type: 'boolean', name: ACKNOWLEDGED_FIELD, displayMode: 'checkbox' }, ...SIGNING_ELEMENTS_JSON],
    ...signingCompositeHandlers(isSignedAcknowledgement),
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
    getErrorText(question) {
      return !question.isEmpty() && !readAcknowledgementValue(question.value).acknowledged ? ACKNOWLEDGEMENT_REQUIRED_MESSAGE : ''
    },
  })
}
