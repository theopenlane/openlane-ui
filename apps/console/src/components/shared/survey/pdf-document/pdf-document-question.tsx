'use client'

import dynamic from 'next/dynamic'
import { createElement } from 'react'
import { ReactQuestionFactory, SurveyQuestionElementBase } from 'survey-react-ui'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { InfoCard } from '@/components/shared/file-preview/preview-chrome'
import { toValidHref } from '@/utils/normalizeUrl'
import { PDF_DOCUMENT_QUESTION_TYPE, type QuestionPdfDocumentModel } from './pdf-document-model'

const PdfDocumentViewer = dynamic(() => import('./pdf-document-viewer'), {
  ssr: false,
  loading: () => <Skeleton className="h-[600px] max-h-[70vh] w-full rounded-md" />,
})

class SurveyQuestionPdfDocument extends SurveyQuestionElementBase {
  protected get question(): QuestionPdfDocumentModel {
    return this.questionBase as QuestionPdfDocumentModel
  }

  private handleReachedEnd = () => {
    this.question.markReachedEnd()
  }

  protected renderElement() {
    const question = this.question
    const url = toValidHref(question.pdfUrl)

    if (!url) {
      return <InfoCard tone="muted" message={question.isDesignMode ? 'Add a PDF URL in the question settings to show the document here.' : 'No document has been attached to this question.'} />
    }

    return (
      <PdfDocumentViewer
        key={url}
        url={url}
        title={question.processedTitle}
        trackReading={question.canRecordReading}
        requireReading={question.isRequired}
        hasReachedEnd={question.hasReachedEnd}
        onReachedEnd={this.handleReachedEnd}
      />
    )
  }
}

ReactQuestionFactory.Instance.registerQuestion(PDF_DOCUMENT_QUESTION_TYPE, (props) => createElement(SurveyQuestionPdfDocument, props))
