'use client'

import { useCallback } from 'react'
import { ExportExportFormat, ExportExportType, InternalPolicyDocumentManagementMode } from '@repo/codegen/src/schema'
import { useCreateExport, useExportFile } from '@/lib/graphql-hooks/export'
import { type TExportMetadata } from '@/components/shared/export/use-file-export'
import { useFetchInternalPolicyDocument, useFetchInternalPolicyRevision, type TInternalPolicyDocument } from '@/lib/graphql-hooks/internal-policy'
import { PDF_MIME_TYPE } from '@/components/shared/file-preview/preview-mime'
import { UserFacingError } from '@/utils/graphQlErrorMatcher'
import { getDataUrlByteSize, toDataUrl } from '@/utils/data-url'
import { type TPdfDocumentAttachment } from '@theopenlane/surveyjs-components'
import { embedBudgetExceededMessage } from './pdf-document-budget'

const tooLargeError = (bytes: number, budgetBytes: number) => new UserFacingError(embedBudgetExceededMessage('The exported PDF', bytes, budgetBytes))

const policyChangedError = () => new UserFacingError('The policy changed while it was being exported. Please try again.')

type TStoredPdfFile = NonNullable<TInternalPolicyDocument['file']>

// storedPdfFile returns the uploaded file of a policy kept as an external reference PDF; that file is the
// source of truth, so it is attached as is instead of being re-rendered from the extracted text
const storedPdfFile = (policy: TInternalPolicyDocument | null): TStoredPdfFile | null => {
  if (policy?.managementMode !== InternalPolicyDocumentManagementMode.EXTERNAL_REFERENCE || !policy.file) return null
  return policy.file.detectedMimeType?.toLowerCase().startsWith(PDF_MIME_TYPE) ? policy.file : null
}

// providedFileName is stored without its extension
const pdfFileName = (name: string | null | undefined, fallback: string) => {
  const base = name || fallback
  return base.toLowerCase().endsWith('.pdf') ? base : `${base}.pdf`
}

export const usePolicyPdfExport = () => {
  const { mutateAsync: createExport } = useCreateExport()
  const { waitForExportFile, fetchExportFileContent } = useExportFile()
  const fetchPolicyDocument = useFetchInternalPolicyDocument()
  const fetchPolicyRevision = useFetchInternalPolicyRevision()

  // toAttachment reads a stored PDF file and checks it against the embed budget and the policy revision it was read at
  const toAttachment = useCallback(
    async (policy: TInternalPolicyDocument, fileId: string, fileName: string, revisionBefore: string | null, budgetBytes: number, signal: AbortSignal): Promise<TPdfDocumentAttachment> => {
      const revisionAfter = await fetchPolicyRevision(policy.id, signal)
      if (revisionAfter !== revisionBefore) throw policyChangedError()

      const base64 = await fetchExportFileContent(fileId, signal)
      if (!base64) throw new UserFacingError('The policy PDF could not be read. Please try again later.')

      const pdfData = toDataUrl(base64, PDF_MIME_TYPE)
      const size = getDataUrlByteSize(pdfData)
      if (size > budgetBytes) throw tooLargeError(size, budgetBytes)

      return {
        pdfData,
        pdfFileName: pdfFileName(fileName, policy.name),
        policyId: policy.id,
        policyRevision: revisionAfter ?? '',
        suggestedTitle: policy.name,
      }
    },
    [fetchExportFileContent, fetchPolicyRevision],
  )

  return useCallback(
    async (policy: TInternalPolicyDocument, budgetBytes: number, signal: AbortSignal): Promise<TPdfDocumentAttachment> => {
      // read the policy's current state rather than the possibly stale search result, so a replaced file is picked up
      const current = await fetchPolicyDocument(policy.id, signal)
      signal.throwIfAborted()
      const revisionBefore = current?.revision ?? null

      const storedPdf = storedPdfFile(current)
      if (storedPdf) {
        if ((storedPdf.providedFileSize ?? 0) > budgetBytes) throw tooLargeError(storedPdf.providedFileSize ?? 0, budgetBytes)
        return toAttachment(policy, storedPdf.id, storedPdf.providedFileName, revisionBefore, budgetBytes, signal)
      }

      const { createExport: created } = await createExport({
        input: {
          exportType: ExportExportType.INTERNAL_POLICY,
          format: ExportExportFormat.PDF,
          filters: JSON.stringify({ id: policy.id }),
          exportMetadata: { excludePDFMetadata: true } satisfies TExportMetadata,
        },
      })
      signal.throwIfAborted()

      const file = await waitForExportFile(created.export.id, signal)
      if (file.detectedMimeType && file.detectedMimeType !== PDF_MIME_TYPE) throw new UserFacingError('The policy export did not produce a PDF.')
      if ((file.providedFileSize ?? 0) > budgetBytes) throw tooLargeError(file.providedFileSize ?? 0, budgetBytes)

      return toAttachment(policy, file.id, file.providedFileName, revisionBefore, budgetBytes, signal)
    },
    [createExport, fetchPolicyDocument, toAttachment, waitForExportFile],
  )
}
