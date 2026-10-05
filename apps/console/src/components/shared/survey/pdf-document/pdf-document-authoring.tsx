'use client'

import { useState, type ReactNode } from 'react'
import { Link2, Paperclip, Replace, Trash2 } from 'lucide-react'
import { Button } from '@repo/ui/button'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { pdfAcceptedFileTypes, pdfAcceptedFileTypesShort } from '@/components/shared/file-upload/file-upload-config'
import { type TUploadedFile } from '@/components/shared/file-upload/types'
import { InfoCard } from '@/components/shared/file-preview/preview-chrome'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { ObjectAssociationMap } from '@/components/shared/enum-mapper/object-association-enum'
import { useNotification } from '@/hooks/useNotification'
import { getDataUrlByteSize } from '@/utils/data-url'
import { formatFileSize } from '@/utils/strings'
import { type TPdfDocumentAttachment } from './pdf-document-model'
import { isPdfDataUrl, PDF_DOCUMENT_EMBED_BUDGET_MB } from './pdf-document-type'
import PdfDocumentPolicyPicker from './pdf-document-policy-picker'
import { embedBudgetExceededMessage } from './pdf-document-budget'

type TPdfDocumentAuthoringProps = {
  attachment: TPdfDocumentAttachment
  linkedUrl: string
  budgetBytes: number
  canEdit: boolean
  preview: ReactNode
  onAttach: (attachment: TPdfDocumentAttachment) => void
  onRemove: () => void
}

type TAuthoringMode = 'idle' | 'choose' | 'policy'

const PolicyIcon = ObjectAssociationMap.policies.icon

const PdfDocumentAuthoring = ({ attachment, linkedUrl, budgetBytes, canEdit, preview, onAttach, onRemove }: TPdfDocumentAuthoringProps) => {
  const [mode, setMode] = useState<TAuthoringMode>('idle')
  const [rejectedUploads, setRejectedUploads] = useState(0)
  const { errorNotification } = useNotification()
  const { pdfData, pdfFileName, policyId, policyRevision } = attachment
  const hasSource = pdfData.length > 0 || linkedUrl.length > 0
  const isChoosing = canEdit && (mode === 'choose' || (mode === 'idle' && !hasSource))

  const attach = (next: TPdfDocumentAttachment) => {
    onAttach(next)
    setMode('idle')
  }

  const rejectUpload = (title: string, description: string) => {
    errorNotification({ title, description })
    setRejectedUploads((count) => count + 1)
  }

  const handleFileUpload = ({ url, name }: TUploadedFile) => {
    if (!url || !isPdfDataUrl(url)) {
      rejectUpload('Could not attach the file', 'Only PDF files can be attached.')
      return
    }
    const size = getDataUrlByteSize(url)
    if (size > budgetBytes) {
      rejectUpload('File too large', embedBudgetExceededMessage(name ?? 'This file', size, budgetBytes))
      return
    }
    attach({ pdfData: url, pdfFileName: name ?? '' })
  }

  if (!canEdit && !hasSource) return <InfoCard tone="muted" message="No document has been attached to this question." />

  const sourceIcon = policyId ? <PolicyIcon size={16} /> : pdfData ? <Paperclip size={16} /> : <Link2 size={16} />
  const sourceLabel = pdfData ? pdfFileName || 'Embedded PDF' : linkedUrl
  const sourceDetails = pdfData ? [policyId && (policyRevision ? `Policy ${policyRevision}` : 'Policy'), formatFileSize(getDataUrlByteSize(pdfData))].filter(Boolean).join(' · ') : 'Linked by URL'

  return (
    <div className="flex flex-col gap-3 whitespace-normal">
      {hasSource && (
        <div className="flex flex-col gap-3 rounded-md border bg-card p-3">
          <div className="flex min-w-0 items-start gap-2 text-sm">
            <span className="mt-0.5 shrink-0 text-muted-foreground">{sourceIcon}</span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-medium" title={sourceLabel}>
                {sourceLabel}
              </span>
              <span className="text-xs text-muted-foreground">{sourceDetails}</span>
            </div>
          </div>
          {canEdit && mode === 'idle' && (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" icon={<Replace size={16} />} iconPosition="left" onClick={() => setMode('choose')}>
                Replace
              </Button>
              <Button variant="secondary" icon={<Trash2 size={16} />} iconPosition="left" onClick={onRemove}>
                Remove
              </Button>
            </div>
          )}
        </div>
      )}
      {isChoosing && (
        <>
          <FileUpload
            key={rejectedUploads}
            onFileUpload={handleFileUpload}
            maxFileSizeInMb={PDF_DOCUMENT_EMBED_BUDGET_MB}
            acceptedFileTypes={pdfAcceptedFileTypes}
            acceptedFileTypesShort={pdfAcceptedFileTypesShort}
            multipleFiles={false}
            inputLabel="Upload a PDF document"
          />
          <p className="text-xs text-muted-foreground">The PDF is embedded in the questionnaire. All embedded documents in a questionnaire share the {PDF_DOCUMENT_EMBED_BUDGET_MB} MB limit.</p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>Or pick one of your policies:</span>
            <Button variant="secondary" icon={<PolicyIcon size={16} />} iconPosition="left" onClick={() => setMode('policy')}>
              Use a policy
            </Button>
            {hasSource && <CancelButton onClick={() => setMode('idle')} />}
          </div>
        </>
      )}
      {canEdit && mode === 'policy' && <PdfDocumentPolicyPicker budgetBytes={budgetBytes} onAttach={attach} onCancel={() => setMode(hasSource ? 'idle' : 'choose')} />}
      {preview}
    </div>
  )
}

export default PdfDocumentAuthoring
