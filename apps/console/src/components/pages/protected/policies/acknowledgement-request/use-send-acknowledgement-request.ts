'use client'

import { useCallback } from 'react'
import { endOfDay } from 'date-fns'
import { AssessmentAssessmentType } from '@repo/codegen/src/schema'
import { useCreateAssessmentWithPolicies } from '@/lib/graphql-hooks/assessment'
import { type TSendAssessmentResult, type TAssessmentRecipient, useSendAssessmentToRecipients } from '@/lib/graphql-hooks/assessment-response'
import { type TPdfDocumentAttachment } from '@/components/shared/survey/pdf-document/pdf-document-type'
import { buildAcknowledgementSurvey } from './build-acknowledgement-survey'

type TAcknowledgementRequest = {
  documents: TPdfDocumentAttachment[]
  name: string
  statement: string
  recipients: TAssessmentRecipient[]
  dueDate: Date | null
}

export type TAcknowledgementRequestPhase = 'creating' | 'sending'

type TAcknowledgementRequestOptions = {
  signal: AbortSignal
  onPhase: (phase: TAcknowledgementRequestPhase) => void
}

export type TAcknowledgementRequestResult = { assessmentId: string; sendResult: TSendAssessmentResult | null }

export const useSendAcknowledgementRequest = () => {
  const { mutateAsync: createAssessment } = useCreateAssessmentWithPolicies()
  const sendAssessment = useSendAssessmentToRecipients()

  return useCallback(
    async ({ documents, name, statement, recipients, dueDate }: TAcknowledgementRequest, { signal, onPhase }: TAcknowledgementRequestOptions): Promise<TAcknowledgementRequestResult> => {
      signal.throwIfAborted()
      onPhase('creating')

      const { createAssessmentWithPolicies } = await createAssessment({
        name,
        jsonconfig: buildAcknowledgementSurvey({ title: name, statement, documents }),
        assessmentType: AssessmentAssessmentType.INTERNAL,
      })
      const assessmentId = createAssessmentWithPolicies.assessment.id

      if (recipients.length === 0) return { assessmentId, sendResult: null }

      signal.throwIfAborted()
      onPhase('sending')

      const sendResult = await sendAssessment({ assessmentId, recipients, dueDate: dueDate ? endOfDay(dueDate).toISOString() : null })
      return { assessmentId, sendResult }
    },
    [createAssessment, sendAssessment],
  )
}
