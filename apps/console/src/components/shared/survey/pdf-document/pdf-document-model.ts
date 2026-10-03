import { ElementFactory, Question, Serializer } from 'survey-core'
import { PDF_DOCUMENT_QUESTION_TYPE } from './pdf-document-type'

export { PDF_DOCUMENT_QUESTION_TYPE }

export const SCROLL_TO_END_MESSAGE = 'Scroll to the end of the document to continue.'

export class QuestionPdfDocumentModel extends Question {
  constructor(name: string) {
    super(name)
    this.locRequiredErrorText.defaultValue = SCROLL_TO_END_MESSAGE
  }

  getType(): string {
    return PDF_DOCUMENT_QUESTION_TYPE
  }

  get isNewA11yStructure(): boolean {
    return true
  }

  get pdfUrl(): string {
    return this.getPropertyValue('pdfUrl') ?? ''
  }

  set pdfUrl(value: string) {
    this.setPropertyValue('pdfUrl', value)
  }

  get hasReachedEnd(): boolean {
    return this.value === true
  }

  get canRecordReading(): boolean {
    return !this.isReadOnly && !this.isDesignMode
  }

  markReachedEnd(): void {
    if (this.canRecordReading && !this.hasReachedEnd) {
      this.value = true
    }
  }
}

Serializer.addClass(
  PDF_DOCUMENT_QUESTION_TYPE,
  [
    { name: 'pdfUrl', category: 'general', visibleIndex: 3 },
    { name: 'isRequired:switch', default: true, overridingProperty: 'requiredIf' },
  ],
  () => new QuestionPdfDocumentModel(''),
  'question',
)

ElementFactory.Instance.registerElement(PDF_DOCUMENT_QUESTION_TYPE, (name) => new QuestionPdfDocumentModel(name))
