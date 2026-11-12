'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { type UpdateVendorRiskScoreInput } from '@repo/codegen/src/schema'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { type TVendorRiskAggregate, type TVendorRiskScoringNode, useSaveVendorRiskAnswer, vendorRiskScoringQueryKey } from '@/lib/graphql-hooks/vendor-risk-score'
import { incompleteDraftReason, isYesAnswer, NO_RISK_LIKELIHOOD, toCreateRiskScoreInput, type TAnswerDraft, type TRiskQuestion } from './risk-answers'

const AUTOSAVE_DELAY_MS = 800

const MAX_FLUSH_PASSES = 5

export type TSaveStatus = 'idle' | 'pending' | 'success' | 'error'

type TQuestionSaveState = {
  savedId: string | undefined
  pending: UpdateVendorRiskScoreInput
  draft: TAnswerDraft | undefined
  item: TRiskQuestion | undefined
  queue: Promise<void>
  timer: ReturnType<typeof setTimeout> | undefined
  failed: boolean
  uncertainCreate: boolean
  generation: number
}

const newState = (savedId: string | undefined): TQuestionSaveState => ({
  savedId,
  pending: {},
  draft: undefined,
  item: undefined,
  queue: Promise.resolve(),
  timer: undefined,
  failed: false,
  uncertainCreate: false,
  generation: 0,
})

const OPPOSITE_FIELDS = [
  ['answer', 'clearAnswer'],
  ['notes', 'clearNotes'],
] as const satisfies readonly (readonly [keyof UpdateVendorRiskScoreInput, keyof UpdateVendorRiskScoreInput])[]

const mergePatch = (pending: UpdateVendorRiskScoreInput, patch: UpdateVendorRiskScoreInput, drop: readonly (keyof UpdateVendorRiskScoreInput)[]): UpdateVendorRiskScoreInput => {
  const merged: UpdateVendorRiskScoreInput = { ...pending }
  OPPOSITE_FIELDS.forEach(([value, clear]) => {
    if (value in patch) delete merged[clear]
    if (clear in patch) delete merged[value]
  })
  Object.assign(merged, patch)
  drop.forEach((field) => delete merged[field])
  return merged
}

const clearQueuedWork = (state: TQuestionSaveState) => {
  clearTimeout(state.timer)
  state.timer = undefined
  state.pending = {}
  state.draft = undefined
  state.failed = false
  state.generation += 1
}

const isNewer = (next: TVendorRiskAggregate, current: TVendorRiskAggregate | undefined) => !current || Date.parse(next.updatedAt ?? '') >= Date.parse(current.updatedAt ?? '')

export const useRiskAnswerSaver = (entityId: string, items: readonly TRiskQuestion[]) => {
  const queryClient = useQueryClient()
  const { mutateAsync } = useSaveVendorRiskAnswer(entityId)
  const { errorNotification } = useNotification()
  const statesRef = useRef(new Map<string, TQuestionSaveState>())
  const aggregateRef = useRef<TVendorRiskAggregate | undefined>(undefined)
  const savedAnyRef = useRef(false)
  const [statuses, setStatuses] = useState<Record<string, TSaveStatus>>({})
  const [drafts, setDrafts] = useState<Record<string, TAnswerDraft>>({})
  const [aggregate, setAggregate] = useState<TVendorRiskAggregate | undefined>(undefined)

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

  const setStatus = useCallback((key: string, status: TSaveStatus) => setStatuses((current) => (current[key] === status ? current : { ...current, [key]: status })), [])

  const adoptCommittedCreate = useCallback(
    async (key: string, state: TQuestionSaveState) => {
      const queryKey = vendorRiskScoringQueryKey(entityId)
      await queryClient.refetchQueries({ queryKey, exact: true }, { throwOnError: true })
      const committed = (queryClient.getQueryData<TVendorRiskScoringNode[]>(queryKey) ?? [])
        .filter((score) => score.questionKey === key)
        .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))[0]
      if (committed) state.savedId = committed.id
      state.uncertainCreate = false
    },
    [entityId, queryClient],
  )

  const flush = useCallback(
    (key: string) => {
      const state = stateFor(key)
      clearTimeout(state.timer)
      state.timer = undefined
      state.queue = state.queue.then(async () => {
        const { draft, item } = state
        const generation = state.generation
        if (!draft || !item) return
        const answer = draft.answer.trim()
        const isReady = !!answer && (isYesAnswer(item.score ?? item.question, answer) || !!draft.likelihood)
        if (state.savedId ? Object.keys(state.pending).length === 0 : !isReady) {
          state.failed = false
          return
        }
        setStatus(key, 'pending')
        let isCreate = false
        let pending: UpdateVendorRiskScoreInput = {}
        try {
          if (!state.savedId && state.uncertainCreate) await adoptCommittedCreate(key, state)
          isCreate = !state.savedId
          pending = state.pending
          state.pending = {}
          const { score, aggregate: savedAggregate } = state.savedId
            ? await mutateAsync({ kind: 'update', id: state.savedId, input: pending })
            : await mutateAsync({
                kind: 'create',
                input: toCreateRiskScoreInput(entityId, item.question, {
                  answer: (state.draft ?? draft).answer.trim(),
                  likelihood: (state.draft ?? draft).likelihood ?? NO_RISK_LIKELIHOOD,
                  impact: (state.draft ?? draft).impact,
                  notes: (state.draft ?? draft).notes,
                }),
              })
          state.savedId = score.id
          state.failed = false
          savedAnyRef.current = true
          if (savedAggregate && isNewer(savedAggregate, aggregateRef.current)) {
            aggregateRef.current = savedAggregate
            setAggregate(savedAggregate)
          }
          if (state.generation === generation && !state.timer && Object.keys(state.pending).length === 0) setStatus(key, 'success')
        } catch (error) {
          state.pending = mergePatch(pending, state.pending, [])
          state.failed = true
          if (isCreate) state.uncertainCreate = true
          if (state.generation === generation) setStatus(key, 'error')
          errorNotification({ title: 'Could not save the answer', description: parseErrorMessage(error) })
        }
      })
      return state.queue
    },
    [adoptCommittedCreate, entityId, errorNotification, mutateAsync, setStatus, stateFor],
  )

  const stage = useCallback(
    (item: TRiskQuestion, draft: TAnswerDraft, patch: UpdateVendorRiskScoreInput, { debounce = false, drop = [] }: { debounce?: boolean; drop?: (keyof UpdateVendorRiskScoreInput)[] } = {}) => {
      const key = item.question.key
      const state = stateFor(key)
      state.pending = mergePatch(state.pending, patch, drop)
      state.draft = draft
      state.item = item
      state.generation += 1
      setDrafts((current) => ({ ...current, [key]: draft }))
      setStatus(key, 'idle')
      clearTimeout(state.timer)
      if (debounce) {
        state.timer = setTimeout(() => flush(key), AUTOSAVE_DELAY_MS)
        return Promise.resolve()
      }
      return flush(key)
    },
    [flush, setStatus, stateFor],
  )

  const flushAll = useCallback(async () => {
    for (let pass = 0; pass < MAX_FLUSH_PASSES; pass += 1) {
      await Promise.all([...statesRef.current.keys()].map(flush))
      if (![...statesRef.current.values()].some((state) => state.timer)) break
    }
    return { failedKeys: [...statesRef.current.entries()].filter(([, state]) => state.failed).map(([key]) => key), savedAny: savedAnyRef.current }
  }, [flush])

  const incompleteKeys = useMemo(
    () =>
      items.flatMap((item) => {
        const draft = drafts[item.question.key]
        return draft && incompleteDraftReason(item, draft) ? [item.question.key] : []
      }),
    [drafts, items],
  )

  const discardDrafts = useCallback((keys: readonly string[]) => {
    keys.forEach((key) => {
      const state = statesRef.current.get(key)
      if (state) clearQueuedWork(state)
    })
    setDrafts((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !keys.includes(key))))
  }, [])

  const reset = useCallback(() => {
    statesRef.current.forEach(clearQueuedWork)
    aggregateRef.current = undefined
    savedAnyRef.current = false
    setStatuses({})
    setDrafts({})
    setAggregate(undefined)
  }, [])

  return { stage, flushAll, statuses, drafts, incompleteKeys, discardDrafts, aggregate, reset }
}
