'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'
import type { TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap.ts'

const STORAGE_VERSION = 1
const PERSIST_DEBOUNCE_MS = 500

export type FormDraftPayload<TForm extends FieldValues, TStore = unknown> = {
  version: number
  savedAt: number
  formValues: TForm
  storeSnapshot?: TStore
}

export type AssociationDraftStore = {
  associations: TObjectAssociationMap
  associationRefCodes: TObjectAssociationMap
}

type Options<TForm extends FieldValues, TStore> = {
  storageKey: string
  enabled: boolean
  form: UseFormReturn<TForm>
  subscribeStore?: (listener: () => void) => () => void
  getStoreSnapshot?: () => TStore
  applyStoreSnapshot?: (snapshot: TStore) => void
}

const safeReadDraft = <TForm extends FieldValues, TStore>(storageKey: string): FormDraftPayload<TForm, TStore> | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as FormDraftPayload<TForm, TStore>
    if (!parsed || parsed.version !== STORAGE_VERSION) {
      window.localStorage.removeItem(storageKey)
      return null
    }
    return parsed
  } catch {
    try {
      window.localStorage.removeItem(storageKey)
    } catch {
      /* ignore */
    }
    return null
  }
}

const safeRemove = (storageKey: string) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(storageKey)
  } catch {
    /* ignore */
  }
}

export function useFormDraft<TForm extends FieldValues, TStore = unknown>(opts: Options<TForm, TStore>) {
  const { storageKey, enabled, form } = opts

  // Held in a ref so callers don't need to memoize them — otherwise inline
  // arrow-function props would invalidate persist's deps and re-subscribe
  // form.watch / store.subscribe on every render.
  const callbacksRef = useRef(opts)
  useEffect(() => {
    callbacksRef.current = opts
  })

  const [pendingDraft, setPendingDraft] = useState<FormDraftPayload<TForm, TStore> | null>(null)
  const [decisionMade, setDecisionMade] = useState(false)
  const [editorKey, setEditorKey] = useState(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled) {
      setPendingDraft(null)
      setDecisionMade(true)
      return
    }
    const draft = safeReadDraft<TForm, TStore>(storageKey)
    if (draft) {
      setPendingDraft(draft)
    } else {
      setPendingDraft(null)
      setDecisionMade(true)
    }
  }, [storageKey, enabled])

  const persist = useCallback(() => {
    if (!enabled || !decisionMade || typeof window === 'undefined') return
    if (!form.formState.isDirty) return
    try {
      const payload: FormDraftPayload<TForm, TStore> = {
        version: STORAGE_VERSION,
        savedAt: Date.now(),
        formValues: form.getValues(),
        storeSnapshot: callbacksRef.current.getStoreSnapshot?.(),
      }
      window.localStorage.setItem(storageKey, JSON.stringify(payload))
    } catch {
      /* ignore quota / private mode errors */
    }
  }, [enabled, decisionMade, form, storageKey])

  const schedulePersist = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(persist, PERSIST_DEBOUNCE_MS)
  }, [persist])

  useEffect(() => {
    if (!enabled || !decisionMade) return
    const subscription = form.watch(() => schedulePersist())
    return () => subscription.unsubscribe()
  }, [enabled, decisionMade, form, schedulePersist])

  useEffect(() => {
    if (!enabled || !decisionMade) return
    return callbacksRef.current.subscribeStore?.(() => schedulePersist())
  }, [enabled, decisionMade, schedulePersist])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const restore = useCallback(() => {
    if (!pendingDraft) return
    form.reset(pendingDraft.formValues)
    if (pendingDraft.storeSnapshot) {
      callbacksRef.current.applyStoreSnapshot?.(pendingDraft.storeSnapshot)
    }
    setPendingDraft(null)
    setEditorKey((k) => k + 1)
    setDecisionMade(true)
  }, [form, pendingDraft])

  const discard = useCallback(() => {
    safeRemove(storageKey)
    setPendingDraft(null)
    setDecisionMade(true)
  }, [storageKey])

  const clearDraft = useCallback(() => {
    safeRemove(storageKey)
  }, [storageKey])

  return {
    pendingDraft,
    restore,
    discard,
    clearDraft,
    editorKey,
  }
}
