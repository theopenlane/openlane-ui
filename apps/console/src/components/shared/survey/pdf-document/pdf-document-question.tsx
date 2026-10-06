'use client'

import dynamic from 'next/dynamic'
import { createElement } from 'react'
import { ReactQuestionFactory, SurveyQuestionElementBase } from 'survey-react-ui'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { InfoCard } from '@/components/shared/file-preview/preview-chrome'
import { toValidHref } from '@/utils/normalizeUrl'
import { PDF_DOCUMENT_QUESTION_TYPE, type QuestionPdfDocumentModel, type TPdfDocumentAttachment } from './pdf-document-model'
import { PDF_DOCUMENT_EMBED_BUDGET_BYTES } from './pdf-document-type'

const PdfDocumentViewer = dynamic(() => import('./pdf-document-viewer'), {
  ssr: false,
  loading: () => <Skeleton className="h-[600px] max-h-[70vh] w-full rounded-md" />,
})

const PdfDocumentAuthoring = dynamic(() => import('./pdf-document-authoring'), {
  ssr: false,
  loading: () => <Skeleton className="h-[200px] w-full rounded-md" />,
})

type TUndoRedoHost = { startUndoRedoTransaction: (name: string) => void; stopUndoRedoTransaction: () => void }

const isUndoRedoHost = (value: object | null | undefined): value is TUndoRedoHost =>
  !!value && 'startUndoRedoTransaction' in value && typeof value.startUndoRedoTransaction === 'function' && 'stopUndoRedoTransaction' in value

class SurveyQuestionPdfDocument extends SurveyQuestionElementBase {
  protected get question(): QuestionPdfDocumentModel {
    return this.questionBase as QuestionPdfDocumentModel
  }

  private handleReachedEnd = () => {
    this.question.markReachedEnd()
  }

  private inUndoTransaction(name: string, change: () => void) {
    const host = this.props.creator
    if (!isUndoRedoHost(host)) return change()
    host.startUndoRedoTransaction(name)
    try {
      change()
    } finally {
      host.stopUndoRedoTransaction()
    }
  }

  private handleAttach = (attachment: TPdfDocumentAttachment) => {
    this.inUndoTransaction('Attach document', () => this.question.attachDocument(attachment))
  }

  private handleRemove = () => {
    this.inUndoTransaction('Remove document', () => this.question.removeDocument())
  }

  protected renderElement() {
    const question = this.question
    const source = question.embeddedSource || toValidHref(question.pdfUrl)

    const viewer = source ? (
      <PdfDocumentViewer
        key={source}
        source={source}
        title={question.processedTitle}
        trackReading={question.canRecordReading}
        requireReading={question.isRequired}
        hasReachedEnd={question.hasReachedEnd}
        onReachedEnd={this.handleReachedEnd}
      />
    ) : null

    if (question.isDesignMode) {
      return (
        <PdfDocumentAuthoring
          attachment={{ pdfData: question.pdfData, pdfFileName: question.pdfFileName, policyId: question.policyId, policyRevision: question.policyRevision }}
          linkedUrl={question.hasEmbeddedDocument ? '' : source}
          budgetBytes={PDF_DOCUMENT_EMBED_BUDGET_BYTES - question.otherEmbeddedBytes}
          canEdit={question.canEditDocument}
          preview={viewer}
          onAttach={this.handleAttach}
          onRemove={this.handleRemove}
        />
      )
    }

    return viewer ?? <InfoCard tone="muted" message="No document has been attached to this question." />
  }
}

ReactQuestionFactory.Instance.registerQuestion(PDF_DOCUMENT_QUESTION_TYPE, (props) => createElement(SurveyQuestionPdfDocument, props))
