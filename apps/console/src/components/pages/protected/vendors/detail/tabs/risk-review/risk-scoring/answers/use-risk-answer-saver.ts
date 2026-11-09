'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { type UpdateVendorRiskScoreInput, type VendorRiskScoreVendorRiskImpact, type VendorRiskScoreVendorRiskLikelihood } from '@repo/codegen/src/schema'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useSaveVendorRiskAnswer } from '@/lib/graphql-hooks/vendor-risk-score'
import { isYesAnswer, NO_RISK_LIKELIHOOD, toCreateRiskScoreInput, type TRiskQuestion } from './risk-answers'

const AUTOSAVE_DELAY_MS = 800

export type TAnswerDraft = {
  answer: string
  likelihood: VendorRiskScoreVendorRiskLikelihood | undefined
  impact: VendorRiskScoreVendorRiskImpact
  notes: string
}

export type TSaveStatus = 'idle' | 'pending' | 'success' | 'error'

type TQuestionSaveState = {
  savedId: string | undefined
  pending: UpdateVendorRiskScoreInput
  draft: TAnswerDraft | undefined
  item: TRiskQuestion | undefined
  queue: Promise<void>
  timer: ReturnType<typeof setTimeout> | undefined
}

const newState = (savedId: string | undefined): TQuestionSaveState => ({ savedId, pending: {}, draft: undefined, item: undefined, queue: Promise.resolve(), timer: undefined })

export const useRiskAnswerSaver = (entityId: string, items: readonly TRiskQuestion[]) => {
  const { mutateAsync } = useSaveVendorRiskAnswer(entityId)
  const { errorNotification } = useNotification()
  const statesRef = useRef(new Map<string, TQuestionSaveState>())
  const [statuses, setStatuses] = useState<Record<string, TSaveStatus>>({})

  useEffect(() => {
    items.forEach(({ question, score }) => {
      const state = statesRef.current.get(question.key)
      if (!state) statesRef.current.set(question.key, newState(score?.id))
      else if (score?.id) state.savedId = score.id
    })
  }, [items])

  const stateFor = useCallback((key: string) => {
    const existing = statesRef.current.get(key)
    if (existing) return existing
    const created = newState(undefined)
    statesRef.current.set(key, created)
    return created
  }, [])

  const setStatus = useCallback((key: string, status: TSaveStatus) => setStatuses((current) => ({ ...current, [key]: status })), [])

  const flush = useCallback(
    (key: string) => {
      const state = stateFor(key)
      clearTimeout(state.timer)
      state.timer = undefined
      state.queue = state.queue.then(async () => {
        const { draft, item, pending } = state
        if (!draft || !item) return
        const answer = draft.answer.trim()
        const isReady = !!answer && (isYesAnswer(item.score ?? item.question, answer) || !!draft.likelihood)
        if (state.savedId ? Object.keys(pending).length === 0 : !isReady) return
        state.pending = {}
        setStatus(key, 'pending')
        try {
          const saved = state.savedId
            ? await mutateAsync({ kind: 'update', id: state.savedId, input: pending })
            : await mutateAsync({
                kind: 'create',
                input: toCreateRiskScoreInput(entityId, item.question, { answer, likelihood: draft.likelihood ?? NO_RISK_LIKELIHOOD, impact: draft.impact, notes: draft.notes }),
              })
          state.savedId = saved.id
          setStatus(key, 'success')
        } catch (error) {
          state.pending = { ...pending, ...state.pending }
          setStatus(key, 'error')
          errorNotification({ title: 'Could not save the answer', description: parseErrorMessage(error) })
        }
      })
      return state.queue
    },
    [entityId, errorNotification, mutateAsync, setStatus, stateFor],
  )

  const stage = useCallback(
    (item: TRiskQuestion, draft: TAnswerDraft, patch: UpdateVendorRiskScoreInput, { debounce = false, drop = [] }: { debounce?: boolean; drop?: (keyof UpdateVendorRiskScoreInput)[] } = {}) => {
      const key = item.question.key
      const state = stateFor(key)
      const pending: UpdateVendorRiskScoreInput = { ...state.pending, ...patch }
      drop.forEach((field) => delete pending[field])
      state.pending = pending
      state.draft = draft
      state.item = item
      clearTimeout(state.timer)
      if (debounce) {
        state.timer = setTimeout(() => flush(key), AUTOSAVE_DELAY_MS)
        return Promise.resolve()
      }
      return flush(key)
    },
    [flush, stateFor],
  )

  const flushAll = useCallback(() => Promise.all([...statesRef.current.keys()].map((key) => (statesRef.current.get(key)?.timer ? flush(key) : statesRef.current.get(key)?.queue))), [flush])

  const resetStatuses = useCallback(() => setStatuses({}), [])

  return { stage, flushAll, statuses, resetStatuses }
}
