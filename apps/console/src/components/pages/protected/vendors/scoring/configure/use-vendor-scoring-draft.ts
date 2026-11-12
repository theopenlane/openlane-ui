'use client'

import { useCallback, useMemo, useState } from 'react'
import { type VendorScoringConfigVendorScoringMode } from '@repo/codegen/src/schema'
import { buildVendorScoringConfigInput, getDefaultMaxScore, type TDraftQuestion, type TQuestionDraftValues, type TVendorScoringDraft } from '@/lib/vendor-scoring-config'
import { type TVendorRiskRating } from '@/lib/vendor-risk-rating'
import { diffBuiltInput, isDeepEqual } from '@/utils/input-diff'

let nextNewQuestionId = 0

export const useVendorScoringDraft = (initial: TVendorScoringDraft) => {
  const [baseline, setBaseline] = useState(initial)
  const [draft, setDraft] = useState(initial)

  const mapQuestion = useCallback(
    (draftId: string, update: (question: TDraftQuestion) => TDraftQuestion) =>
      setDraft((current) => ({ ...current, questions: current.questions.map((question) => (question.draftId === draftId ? update(question) : question)) })),
    [],
  )

  const setQuestionEnabled = useCallback((draftId: string, enabled: boolean) => mapQuestion(draftId, (question) => ({ ...question, enabled })), [mapQuestion])

  const updateQuestion = useCallback((draftId: string, values: TQuestionDraftValues) => mapQuestion(draftId, (question) => ({ ...question, ...values })), [mapQuestion])

  const addQuestion = useCallback((values: TQuestionDraftValues) => {
    nextNewQuestionId += 1
    setDraft((current) => ({ ...current, questions: [...current.questions, { ...values, key: '', enabled: true, draftId: `new-${nextNewQuestionId}` }] }))
  }, [])

  const removeQuestion = useCallback((draftId: string) => setDraft((current) => ({ ...current, questions: current.questions.filter((question) => question.draftId !== draftId) })), [])

  const setScoringMode = useCallback((scoringMode: VendorScoringConfigVendorScoringMode) => setDraft((current) => ({ ...current, scoringMode })), [])

  const setMaxScore = useCallback((rating: TVendorRiskRating, maxScore: number | undefined) => setDraft((current) => ({ ...current, maxScores: { ...current.maxScores, [rating]: maxScore } })), [])

  const resetMaxScores = useCallback(
    (ratings: readonly TVendorRiskRating[]) =>
      setDraft((current) => ({ ...current, maxScores: { ...current.maxScores, ...Object.fromEntries(ratings.map((rating) => [rating, getDefaultMaxScore(rating)])) } })),
    [],
  )

  const discard = useCallback(() => {
    setBaseline(initial)
    setDraft(initial)
  }, [initial])

  const baselineInput = useMemo(() => buildVendorScoringConfigInput(baseline), [baseline])
  const initialInput = useMemo(() => buildVendorScoringConfigInput(initial), [initial])
  const changes = useMemo(() => diffBuiltInput(buildVendorScoringConfigInput(draft), baselineInput), [draft, baselineInput])
  const isDirty = Object.keys(changes).length > 0
  const hasNewerVersion = baseline !== initial && !isDeepEqual(baselineInput, initialInput)

  if (baseline !== initial && !hasNewerVersion) {
    setBaseline(initial)
  } else if (hasNewerVersion && !isDirty) {
    setBaseline(initial)
    setDraft(initial)
  }

  return {
    draft,
    changes,
    isDirty,
    hasNewerVersion,
    setQuestionEnabled,
    updateQuestion,
    addQuestion,
    removeQuestion,
    setScoringMode,
    setMaxScore,
    resetMaxScores,
    discard,
  }
}
