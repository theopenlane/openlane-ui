'use client'

import { useCallback, useRef, useState } from 'react'
import { queryOptions, useQueries, useQueryClient } from '@tanstack/react-query'
import { type TInternalPolicyDocument, useFetchInternalPolicyRevision } from '@/lib/graphql-hooks/internal-policy'
import { usePolicyPdfExport } from '@/components/shared/survey/pdf-document/use-policy-pdf-export'
import { embedBudgetExceededMessage } from '@/components/shared/survey/pdf-document/pdf-document-budget'
import { PDF_DOCUMENT_EMBED_BUDGET_BYTES, type TPdfDocumentAttachment } from '@/components/shared/survey/pdf-document/pdf-document-type'
import { getDataUrlByteSize } from '@/utils/data-url'
import { createConcurrencyLimiter } from '@/utils/async'
import { UserFacingError } from '@/utils/graphQlErrorMatcher'
import { pluralizeWithCount } from '@/utils/strings'

const POLICY_EXPORT_CONCURRENCY = 3
const POLICY_PDF_QUERY_KEY = 'acknowledgementPolicyPdf'

export type TDocumentPreparation = { status: 'idle' } | { status: 'preparing'; exported: number } | { status: 'ready' } | { status: 'error'; error: unknown }

type TPolicyPdfResult = { data?: TPdfDocumentAttachment; isFetching: boolean; error: Error | null }

const totalBytes = (documents: TPdfDocumentAttachment[]) => documents.reduce((total, document) => total + getDataUrlByteSize(document.pdfData), 0)

const budgetExceededError = (policyCount: number, bytes: number) =>
  new UserFacingError(embedBudgetExceededMessage(`The combined export of ${pluralizeWithCount(policyCount, 'policy', 'policies')}`, bytes, PDF_DOCUMENT_EMBED_BUDGET_BYTES))

const toPreparation = (isRequested: boolean, results: TPolicyPdfResult[]): TDocumentPreparation => {
  if (!isRequested) return { status: 'idle' }
  const documents = results.flatMap((result) => (result.data ? [result.data] : []))
  const bytes = totalBytes(documents)
  if (bytes > PDF_DOCUMENT_EMBED_BUDGET_BYTES) return { status: 'error', error: budgetExceededError(results.length, bytes) }
  const error = results.find((result) => result.error && !result.isFetching)?.error
  if (results.some((result) => result.isFetching) || (!error && documents.length < results.length)) return { status: 'preparing', exported: documents.length }
  if (error) return { status: 'error', error }
  return { status: 'ready' }
}

export const usePolicyDocumentPreparation = (policies: TInternalPolicyDocument[]) => {
  const exportPolicyPdf = usePolicyPdfExport()
  const fetchPolicyRevision = useFetchInternalPolicyRevision()
  const queryClient = useQueryClient()
  const [limit] = useState(() => createConcurrencyLimiter(POLICY_EXPORT_CONCURRENCY))
  const [isRequested, setIsRequested] = useState(false)
  const refreshesRef = useRef(new Map<string, Promise<TPdfDocumentAttachment>>())

  const policyPdfQuery = useCallback(
    (policy: TInternalPolicyDocument) =>
      queryOptions({
        queryKey: [POLICY_PDF_QUERY_KEY, policy.id, policy.revision ?? ''],
        queryFn: ({ signal }) => limit(() => exportPolicyPdf(policy, PDF_DOCUMENT_EMBED_BUDGET_BYTES, signal), signal),
        staleTime: Infinity,
        gcTime: 0,
        retry: false,
        refetchOnReconnect: false,
        placeholderData: undefined,
      }),
    [exportPolicyPdf, limit],
  )

  const results = useQueries({ queries: policies.map((policy) => ({ ...policyPdfQuery(policy), enabled: isRequested })) })

  const prefetchDocuments = useCallback(() => {
    setIsRequested(true)
    policies.forEach((policy) => void queryClient.prefetchQuery(policyPdfQuery(policy)))
  }, [policies, policyPdfQuery, queryClient])

  const fetchCurrentDocument = useCallback(
    async (policy: TInternalPolicyDocument) => {
      const query = policyPdfQuery(policy)
      const document = await queryClient.fetchQuery(query)
      if ((await fetchPolicyRevision(policy.id)) === document.policyRevision) return document

      const refreshKey = query.queryKey.join('|')
      const inFlight = refreshesRef.current.get(refreshKey)
      if (inFlight) return inFlight

      queryClient.removeQueries({ queryKey: query.queryKey, exact: true })
      const refresh = queryClient.fetchQuery(query).finally(() => refreshesRef.current.delete(refreshKey))
      refreshesRef.current.set(refreshKey, refresh)
      return refresh
    },
    [fetchPolicyRevision, policyPdfQuery, queryClient],
  )

  const prepareDocuments = useCallback(async () => {
    setIsRequested(true)
    let bytes = 0
    try {
      return await Promise.all(
        policies.map(async (policy) => {
          const document = await fetchCurrentDocument(policy)
          bytes += getDataUrlByteSize(document.pdfData)
          if (bytes > PDF_DOCUMENT_EMBED_BUDGET_BYTES) throw budgetExceededError(policies.length, bytes)
          return document
        }),
      )
    } catch (error) {
      if (bytes > PDF_DOCUMENT_EMBED_BUDGET_BYTES) void queryClient.cancelQueries({ queryKey: [POLICY_PDF_QUERY_KEY] })
      throw error
    }
  }, [fetchCurrentDocument, policies, queryClient])

  return { preparation: toPreparation(isRequested, results), prefetchDocuments, prepareDocuments }
}
