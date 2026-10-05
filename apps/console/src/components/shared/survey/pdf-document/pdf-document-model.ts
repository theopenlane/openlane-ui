import { ElementFactory, Question, Serializer, SurveyModel } from 'survey-core'
import { getDataUrlByteSize } from '@/utils/data-url'
import { isPdfDataUrl, PDF_DOCUMENT_QUESTION_TYPE, PDF_DOCUMENT_READ_LABEL, PDF_DOCUMENT_UNREAD_LABEL, renderPdfDocumentAnswer } from './pdf-document-type'

export { PDF_DOCUMENT_QUESTION_TYPE }

export const SCROLL_TO_END_MESSAGE = 'Scroll to the end of the document to continue.'

export type TPdfDocumentAttachment = {
  pdfData: string
  pdfFileName: string
  policyId?: string
  policyRevision?: string
}

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

  get pdfData(): string {
    return this.getPropertyValue('pdfData') ?? ''
  }

  set pdfData(value: string) {
    this.setPropertyValue('pdfData', value)
  }

  get pdfFileName(): string {
    return this.getPropertyValue('pdfFileName') ?? ''
  }

  set pdfFileName(value: string) {
    this.setPropertyValue('pdfFileName', value)
  }

  get policyId(): string {
    return this.getPropertyValue('policyId') ?? ''
  }

  set policyId(value: string) {
    this.setPropertyValue('policyId', value)
  }

  get policyRevision(): string {
    return this.getPropertyValue('policyRevision') ?? ''
  }

  set policyRevision(value: string) {
    this.setPropertyValue('policyRevision', value)
  }

  get embeddedSource(): string {
    return isPdfDataUrl(this.pdfData) ? this.pdfData : ''
  }

  get hasEmbeddedDocument(): boolean {
    return this.embeddedSource.length > 0
  }

  get otherEmbeddedBytes(): number {
    if (!(this.survey instanceof SurveyModel)) return 0
    return this.survey
      .getAllQuestions(false, true, true)
      .filter((question): question is QuestionPdfDocumentModel => question instanceof QuestionPdfDocumentModel && question !== this)
      .reduce((total, question) => total + getDataUrlByteSize(question.embeddedSource), 0)
  }

  get hasPolicySource(): boolean {
    return this.policyId.length > 0
  }

  get canEditDocument(): boolean {
    return this.isDesignMode && !this.isReadOnly
  }

  attachDocument({ pdfData, pdfFileName, policyId = '', policyRevision = '' }: TPdfDocumentAttachment): void {
    if (pdfData && !isPdfDataUrl(pdfData)) return
    this.pdfData = pdfData
    this.pdfFileName = pdfFileName
    this.policyId = policyId
    this.policyRevision = policyRevision
    this.pdfUrl = ''
  }

  removeDocument(): void {
    this.attachDocument({ pdfData: '', pdfFileName: '' })
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

  getConditionJson(): { type: string; name: string; choices: { value: boolean; text: string }[] } {
    return { type: 'radiogroup', name: this.name, choices: [{ value: true, text: PDF_DOCUMENT_READ_LABEL }] }
  }

  protected getDisplayValueCore(_keysAsText: boolean, value: unknown): string {
    return renderPdfDocumentAnswer(value)
  }

  protected getDisplayValueEmpty(): string {
    return PDF_DOCUMENT_UNREAD_LABEL
  }
}

Serializer.addClass(
  PDF_DOCUMENT_QUESTION_TYPE,
  [
    { name: 'pdfData', visible: false },
    { name: 'pdfFileName', category: 'general', visibleIndex: 3, readOnly: true, dependsOn: ['pdfData'], visibleIf: (question: QuestionPdfDocumentModel) => question.hasEmbeddedDocument },
    { name: 'policyId', category: 'general', visibleIndex: 4, readOnly: true, dependsOn: ['pdfData'], visibleIf: (question: QuestionPdfDocumentModel) => question.hasPolicySource },
    { name: 'policyRevision', category: 'general', visibleIndex: 5, readOnly: true, dependsOn: ['pdfData'], visibleIf: (question: QuestionPdfDocumentModel) => question.hasPolicySource },
    { name: 'pdfUrl', category: 'general', visibleIndex: 6, dependsOn: ['pdfData'], visibleIf: (question: QuestionPdfDocumentModel) => !question.hasEmbeddedDocument },
    { name: 'isRequired:switch', default: true, overridingProperty: 'requiredIf' },
  ],
  () => new QuestionPdfDocumentModel(''),
  'question',
)

ElementFactory.Instance.registerElement(PDF_DOCUMENT_QUESTION_TYPE, (name) => new QuestionPdfDocumentModel(name))
