import { ComponentCollection, type Question } from 'survey-core'
import { applySigningRequired, requiredWhenOtherSigningFieldFilled, SIGNATURE_QUESTION_ICON, SIGNING_ELEMENTS_JSON, signingCompositeHandlers } from './signature-field-model'
import { DEFAULT_SIGNATURE_TITLE, isSignedValue, readSignatureValue, SIGNATURE_QUESTION_TYPE } from './signature-type'

const SIGNATURE_REQUIRED_MESSAGE = 'Enter your full name and sign.'

const applyRequired = (question: Question) => applySigningRequired(question, requiredWhenOtherSigningFieldFilled)

const isSigned = (question: Question) => isSignedValue(readSignatureValue(question.value))

if (!ComponentCollection.Instance.getCustomQuestionByName(SIGNATURE_QUESTION_TYPE)) {
  ComponentCollection.Instance.add({
    name: SIGNATURE_QUESTION_TYPE,
    title: DEFAULT_SIGNATURE_TITLE,
    defaultQuestionTitle: DEFAULT_SIGNATURE_TITLE,
    iconName: SIGNATURE_QUESTION_ICON,
    elementsJSON: SIGNING_ELEMENTS_JSON,
    ...signingCompositeHandlers(isSigned),
    onCreated(question) {
      question.locRequiredErrorText.defaultValue = SIGNATURE_REQUIRED_MESSAGE
    },
    onLoaded(question) {
      applyRequired(question)
    },
    onPropertyChanged(question, propertyName) {
      if (propertyName === 'isRequired') applyRequired(question)
    },
  })
}
