'use client'

import { useCallback } from 'react'
import { ExportExportFormat, ExportExportType } from '@repo/codegen/src/schema'
import { useCreateExport, useExportFile } from '@/lib/graphql-hooks/export'
import { type TExportMetadata } from '@/components/shared/export/use-file-export'
import { useFetchInternalPolicyRevision, type TInternalPolicyDocument } from '@/lib/graphql-hooks/internal-policy'
import { PDF_MIME_TYPE } from '@/components/shared/file-preview/preview-mime'
import { UserFacingError } from '@/utils/graphQlErrorMatcher'
import { getDataUrlByteSize, toDataUrl } from '@/utils/data-url'
import { type TPdfDocumentAttachment } from './pdf-document-type'
import { embedBudgetExceededMessage } from './pdf-document-budget'

const tooLargeError = (bytes: number, budgetBytes: number) => new UserFacingError(embedBudgetExceededMessage('The exported PDF', bytes, budgetBytes))

export const usePolicyPdfExport = () => {
  const { mutateAsync: createExport } = useCreateExport()
  const { waitForExportFile, fetchExportFileContent } = useExportFile()
  const fetchPolicyRevision = useFetchInternalPolicyRevision()

  return useCallback(
    async (policy: TInternalPolicyDocument, budgetBytes: number, signal: AbortSignal): Promise<TPdfDocumentAttachment> => {
      const revisionBefore = await fetchPolicyRevision(policy.id, signal)
      signal.throwIfAborted()
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

      const revisionAfter = await fetchPolicyRevision(policy.id, signal)
      if (revisionAfter !== revisionBefore) throw new UserFacingError('The policy changed while it was being exported. Please try again.')

      const base64 = await fetchExportFileContent(file.id, signal)
      if (!base64) throw new UserFacingError('The exported PDF could not be read. Please try again later.')

      const pdfData = toDataUrl(base64, PDF_MIME_TYPE)
      const size = getDataUrlByteSize(pdfData)
      if (size > budgetBytes) throw tooLargeError(size, budgetBytes)

      return {
        pdfData,
        pdfFileName: file.providedFileName || `${policy.name}.pdf`,
        policyId: policy.id,
        policyRevision: revisionAfter ?? '',
        suggestedTitle: policy.name,
      }
    },
    [createExport, fetchExportFileContent, fetchPolicyRevision, waitForExportFile],
  )
}
