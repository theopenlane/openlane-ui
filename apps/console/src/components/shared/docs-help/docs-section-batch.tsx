'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { docsHelpEnabled } from '@repo/dally/ai'
import { DocsSectionBatchContext, type BatchState, type DocsSectionLookup, type DocsSectionResult } from './docs-section-batch-context'

// wait for the rest of a screenful of rows to register before firing
const COLLECT_WINDOW_MS = 150
// must not exceed the route's per-request cap
const MAX_PER_REQUEST = 40

// Collects section lookups from a list of rows into a single request. Without
// this each row issues its own retrieval, which the browser then serialises
// into a visible top-to-bottom fill
export function DocsSectionBatchProvider({ children }: { children: ReactNode }) {
  const [pendingLookups, setPendingLookups] = useState<DocsSectionLookup[]>([])
  const [results, setResults] = useState<Record<string, DocsSectionResult>>({})
  const [failedKeys, setFailedKeys] = useState<Set<string>>(() => new Set())
  const requestedRef = useRef<Set<string>>(new Set())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const queuedRef = useRef<DocsSectionLookup[]>([])

  const request = useCallback((lookup: DocsSectionLookup) => {
    if (requestedRef.current.has(lookup.key)) return
    requestedRef.current.add(lookup.key)
    queuedRef.current.push(lookup)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const batch = queuedRef.current
      queuedRef.current = []
      setPendingLookups((current) => [...current, ...batch])
    }, COLLECT_WINDOW_MS)
  }, [])

  useEffect(() => () => clearTimeout(timerRef.current ?? undefined), [])

  const inFlight = useMemo(() => pendingLookups.filter((lookup) => !(lookup.key in results)), [pendingLookups, results])
  const batchKey = inFlight.map((lookup) => lookup.key).join('|')

  const { data, isError } = useQuery({
    queryKey: ['docs-help-section-batch', batchKey],
    queryFn: async () => {
      // a screenful of rows asks for more lookups than one request may carry
      const chunks: DocsSectionLookup[][] = []
      for (let start = 0; start < inFlight.length; start += MAX_PER_REQUEST) {
        chunks.push(inFlight.slice(start, start + MAX_PER_REQUEST))
      }

      const merged: Array<DocsSectionResult & { key: string }> = []
      for (const chunk of chunks) {
        const res = await fetch('/api/docs-help', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ batch: chunk.map(({ key, query, prefer, extractSection }) => ({ key, query, prefer, extractSection })) }),
        })
        if (!res.ok) throw new Error(`docs-help ${res.status}`)
        const body = (await res.json()) as { results: Array<DocsSectionResult & { key: string }> }
        merged.push(...(body.results ?? []))
      }
      return { results: merged }
    },
    enabled: docsHelpEnabled && inFlight.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: false,
    placeholderData: undefined,
  })

  useEffect(() => {
    if (!data?.results?.length) return
    setResults((current) => {
      const next = { ...current }
      for (const { key, ...result } of data.results) next[key] = result
      return next
    })
  }, [data])

  // a failed batch never resolves its keys, so record them, callers waiting on
  // one would otherwise read as loading forever
  useEffect(() => {
    if (!isError || inFlight.length === 0) return
    setFailedKeys((current) => {
      const missing = inFlight.filter((lookup) => !current.has(lookup.key))
      return missing.length === 0 ? current : new Set([...current, ...missing.map((lookup) => lookup.key)])
    })
  }, [isError, inFlight])

  const pendingKeys = useMemo(() => new Set(inFlight.map((lookup) => lookup.key)), [inFlight])
  const value = useMemo<BatchState>(
    () => ({ request, results, pending: (key: string) => pendingKeys.has(key), errored: (key: string) => failedKeys.has(key), active: true }),
    [request, results, pendingKeys, failedKeys],
  )

  return <DocsSectionBatchContext value={value}>{children}</DocsSectionBatchContext>
}

// true once the element has been scrolled into view; stays true afterwards
export function useInView<T extends HTMLElement>() {
  const [node, setNode] = useState<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (!node || inView) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setInView(true)
      },
      { rootMargin: '200px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [node, inView])

  return { ref: setNode, inView }
}
