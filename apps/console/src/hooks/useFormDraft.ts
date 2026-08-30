'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'
import type { TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap.ts'
import { getOrganizationStorageItem, getOrganizationStorageKey, removeOrganizationStorageItem, setOrganizationStorageItem } from '@/lib/storage/organization-storage'

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
  // Unscoped storage key; reads/writes are org-scoped via the organization-storage helpers
  storageKey: string
  organizationId?: string
  enabled: boolean
  form: UseFormReturn<TForm>
  subscribeStore?: (listener: () => void) => () => void
  isStoreDirty?: () => boolean
  getStoreSnapshot?: () => TStore
  applyStoreSnapshot?: (snapshot: TStore) => void
}

const safeReadDraft = <TForm extends FieldValues, TStore>(storageKey: string, organizationId?: string): FormDraftPayload<TForm, TStore> | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = getOrganizationStorageItem(storageKey, organizationId)
    if (!raw) return null
    const parsed = JSON.parse(raw) as FormDraftPayload<TForm, TStore>
    if (!parsed || parsed.version !== STORAGE_VERSION) {
      removeOrganizationStorageItem(storageKey, organizationId)
      return null
    }
    return parsed
  } catch {
    try {
      removeOrganizationStorageItem(storageKey, organizationId)
    } catch {
      /* ignore */
    }
    return null
  }
}

const safeRemove = (storageKey: string, organizationId?: string) => {
  try {
    removeOrganizationStorageItem(storageKey, organizationId)
  } catch {
    /* ignore */
  }
}

export const useFormDraft = <TForm extends FieldValues, TStore = unknown>(opts: Options<TForm, TStore>) => {
  const { storageKey, organizationId, enabled, form } = opts
  const scopedKey = getOrganizationStorageKey(storageKey, organizationId)

  // Held in a ref so callers don't need to memoize them — otherwise inline
  // arrow-function props would invalidate persist's deps and re-subscribe
  // form.watch / store.subscribe on every render.
  const callbacksRef = useRef(opts)
  useEffect(() => {
    callbacksRef.current = opts
  })

  const isFormDirty = form.formState.isDirty

  const [pendingDraft, setPendingDraft] = useState<FormDraftPayload<TForm, TStore> | null>(null)
  const [decisionMade, setDecisionMade] = useState(false)
  const [editorKey, setEditorKey] = useState(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevStorageKeyRef = useRef(scopedKey)

  useEffect(() => {
    const storageKeyChanged = prevStorageKeyRef.current !== scopedKey
    prevStorageKeyRef.current = scopedKey

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }

    if (storageKeyChanged && enabled) {
      form.reset()
      setEditorKey((k) => k + 1)
    }

    if (!enabled) {
      setPendingDraft(null)
      setDecisionMade(true)
      return
    }
    const draft = safeReadDraft<TForm, TStore>(storageKey, organizationId)
    if (draft) {
      setPendingDraft(draft)
      setDecisionMade(false)
    } else {
      setPendingDraft(null)
      setDecisionMade(true)
    }
  }, [storageKey, organizationId, scopedKey, enabled, form])

  const persist = useCallback(() => {
    if (!enabled || !decisionMade || typeof window === 'undefined') return
    if (!form.formState.isDirty && !callbacksRef.current.isStoreDirty?.()) return
    try {
      const payload: FormDraftPayload<TForm, TStore> = {
        version: STORAGE_VERSION,
        savedAt: Date.now(),
        formValues: form.getValues(),
        storeSnapshot: callbacksRef.current.getStoreSnapshot?.(),
      }
      setOrganizationStorageItem(storageKey, JSON.stringify(payload), organizationId)
    } catch {
      /* ignore quota / private mode errors */
    }
  }, [enabled, decisionMade, form, storageKey, organizationId])

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
    if (!enabled || !decisionMade || !isFormDirty) return
    schedulePersist()
  }, [enabled, decisionMade, isFormDirty, schedulePersist])

  useEffect(() => {
    if (!enabled || !decisionMade) return
    return callbacksRef.current.subscribeStore?.(() => schedulePersist())
  }, [enabled, decisionMade, schedulePersist])

  const persistRef = useRef(persist)
  useEffect(() => {
    persistRef.current = persist
  })

  useEffect(() => {
    const flush = () => {
      if (!debounceRef.current) return
      clearTimeout(debounceRef.current)
      debounceRef.current = null
      persistRef.current()
    }
    const flushWhenHidden = () => {
      if (document.visibilityState === 'hidden') flush()
    }

    document.addEventListener('visibilitychange', flushWhenHidden)
    window.addEventListener('pagehide', flush)

    return () => {
      document.removeEventListener('visibilitychange', flushWhenHidden)
      window.removeEventListener('pagehide', flush)
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
    if (!enabled) return
    safeRemove(storageKey, organizationId)
    setPendingDraft(null)
    setDecisionMade(true)
  }, [enabled, storageKey, organizationId])

  const clearDraft = useCallback(() => {
    if (!enabled) return
    safeRemove(storageKey, organizationId)
  }, [enabled, storageKey, organizationId])

  return {
    pendingDraft,
    restore,
    discard,
    clearDraft,
    editorKey,
  }
}
