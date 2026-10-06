'use client'

import { useCallback, useState } from 'react'
import { AssessmentResponseAssessmentResponseStatus } from '@repo/codegen/src/schema'
import { EXCLUDE_TEST_RESPONSES, useFetchAllAssessmentResponses, useFetchAssessmentJsonconfig } from '@/lib/graphql-hooks/assessment'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { exportResponsesToCsv } from './export-responses'

const COMPLETED_RESPONSES = { ...EXCLUDE_TEST_RESPONSES, status: AssessmentResponseAssessmentResponseStatus.COMPLETED }

const toFileName = (name: string) => `${name.trim().replace(/[^\p{L}\p{N}_-]+/gu, '_') || 'assessment'}_responses`

export const useExportAssessmentResponses = () => {
  const fetchAllResponses = useFetchAllAssessmentResponses()
  const fetchJsonconfig = useFetchAssessmentJsonconfig()
  const { errorNotification } = useNotification()
  const [exportingIds, setExportingIds] = useState<ReadonlySet<string>>(() => new Set())

  const exportResponses = useCallback(
    async (assessmentId: string, assessmentName: string) => {
      setExportingIds((previous) => new Set(previous).add(assessmentId))
      try {
        const [jsonconfig, responses] = await Promise.all([fetchJsonconfig(assessmentId), fetchAllResponses(assessmentId, { where: COMPLETED_RESPONSES, withAnswers: true })])
        exportResponsesToCsv(responses, jsonconfig, toFileName(assessmentName))
      } catch (error) {
        errorNotification({ title: 'Could not export responses', description: parseErrorMessage(error) })
      } finally {
        setExportingIds((previous) => {
          const next = new Set(previous)
          next.delete(assessmentId)
          return next
        })
      }
    },
    [errorNotification, fetchAllResponses, fetchJsonconfig],
  )

  const isExporting = useCallback((assessmentId: string) => exportingIds.has(assessmentId), [exportingIds])

  return { exportResponses, isExporting }
}
