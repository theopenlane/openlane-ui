'use client'

import dynamic from 'next/dynamic'
import { registerPdfDocumentRenderer, setPdfWorkerSrc, SurveyQuestionPdfDocument, type TPdfDocumentAuthoringProps } from '@theopenlane/surveyjs-components/survey'
import Skeleton from '@/components/shared/skeleton/skeleton'

const PdfDocumentAuthoring = dynamic(() => import('./pdf-document-authoring'), {
  ssr: false,
  loading: () => <Skeleton className="h-[200px] w-full rounded-md" />,
})

class OpenlanePdfDocumentQuestion extends SurveyQuestionPdfDocument {
  protected renderAuthoring(props: TPdfDocumentAuthoringProps) {
    return <PdfDocumentAuthoring {...props} />
  }
}

setPdfWorkerSrc(new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString())
registerPdfDocumentRenderer(OpenlanePdfDocumentQuestion)
