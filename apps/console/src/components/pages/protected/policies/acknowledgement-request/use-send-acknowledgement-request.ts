'use client'

import { useCallback } from 'react'
import { endOfDay } from 'date-fns'
import { AssessmentAssessmentType } from '@repo/codegen/src/schema'
import { useCreateAssessmentWithPolicies } from '@/lib/graphql-hooks/assessment'
import { type TSendAssessmentResult, type TAssessmentRecipient, useSendAssessmentToRecipients } from '@/lib/graphql-hooks/assessment-response'
import { type TInternalPolicyDocument } from '@/lib/graphql-hooks/internal-policy'
import { usePolicyPdfExport } from '@/components/shared/survey/pdf-document/use-policy-pdf-export'
import { embedBudgetExceededMessage } from '@/components/shared/survey/pdf-document/pdf-document-budget'
import { PDF_DOCUMENT_EMBED_BUDGET_BYTES } from '@/components/shared/survey/pdf-document/pdf-document-type'
import { getDataUrlByteSize } from '@/utils/data-url'
import { mapWithConcurrency } from '@/utils/async'
import { UserFacingError } from '@/utils/graphQlErrorMatcher'
import { pluralizeWithCount } from '@/utils/strings'
import { buildAcknowledgementSurvey } from './build-acknowledgement-survey'

const POLICY_EXPORT_CONCURRENCY = 3

type TAcknowledgementRequest = {
  policies: TInternalPolicyDocument[]
  name: string
  statement: string
  recipients: TAssessmentRecipient[]
  dueDate: Date | null
}

export type TAcknowledgementRequestProgress = { phase: 'exporting'; exported: number } | { phase: 'creating' } | { phase: 'sending' }

type TAcknowledgementRequestOptions = {
  signal: AbortSignal
  onProgress: (progress: TAcknowledgementRequestProgress) => void
}

export type TAcknowledgementRequestResult = { assessmentId: string; sendResult: TSendAssessmentResult | null }

export const useSendAcknowledgementRequest = () => {
  const exportPolicyPdf = usePolicyPdfExport()
  const { mutateAsync: createAssessment } = useCreateAssessmentWithPolicies()
  const sendAssessment = useSendAssessmentToRecipients()

  const exportWithinBudget = useCallback(
    async (policies: TInternalPolicyDocument[], signal: AbortSignal, onProgress: (progress: TAcknowledgementRequestProgress) => void) => {
      const failFast = new AbortController()
      const exportSignal = AbortSignal.any([signal, failFast.signal])
      let usedBytes = 0
      let exported = 0
      onProgress({ phase: 'exporting', exported })

      try {
        return await mapWithConcurrency(policies, POLICY_EXPORT_CONCURRENCY, async (policy) => {
          exportSignal.throwIfAborted()
          const document = await exportPolicyPdf(policy, PDF_DOCUMENT_EMBED_BUDGET_BYTES - usedBytes, exportSignal)
          usedBytes += getDataUrlByteSize(document.pdfData)
          if (usedBytes > PDF_DOCUMENT_EMBED_BUDGET_BYTES) {
            throw new UserFacingError(embedBudgetExceededMessage(`The combined export of ${pluralizeWithCount(policies.length, 'policy', 'policies')}`, usedBytes, PDF_DOCUMENT_EMBED_BUDGET_BYTES))
          }
          onProgress({ phase: 'exporting', exported: ++exported })
          return document
        })
      } catch (error) {
        failFast.abort(error)
        throw error
      }
    },
    [exportPolicyPdf],
  )

  return useCallback(
    async ({ policies, name, statement, recipients, dueDate }: TAcknowledgementRequest, { signal, onProgress }: TAcknowledgementRequestOptions): Promise<TAcknowledgementRequestResult> => {
      const documents = await exportWithinBudget(policies, signal, onProgress)
      signal.throwIfAborted()
      onProgress({ phase: 'creating' })

      const { createAssessmentWithPolicies } = await createAssessment({
        name,
        jsonconfig: buildAcknowledgementSurvey({ title: name, statement, documents }),
        assessmentType: AssessmentAssessmentType.INTERNAL,
      })
      const assessmentId = createAssessmentWithPolicies.assessment.id

      if (recipients.length === 0) return { assessmentId, sendResult: null }

      signal.throwIfAborted()
      onProgress({ phase: 'sending' })

      const sendResult = await sendAssessment({ assessmentId, recipients, dueDate: dueDate ? endOfDay(dueDate).toISOString() : null })
      return { assessmentId, sendResult }
    },
    [createAssessment, exportWithinBudget, sendAssessment],
  )
}
