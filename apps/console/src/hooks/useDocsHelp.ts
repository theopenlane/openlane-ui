import { use, useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { DocsHelpChunk, DocsHelpFrame, DocsHelpResponse, DocsSection } from '@/types/docs-help'
import { DocsSectionBatchContext, type DocsSectionResult } from '@/components/shared/docs-help/docs-section-batch-context'

export type { DocsSectionResult }

const DOCS_HELP_STALE_TIME_MS = 5 * 60 * 1000

type DocsHelpRequest = { query: string; prefer?: string; section?: DocsSection; summarize: boolean }
type DocsHelpParams = DocsHelpRequest & { enabled: boolean; seed?: DocsHelpChunk[] }

const readDocsHelp = async (body: DocsHelpRequest, signal: AbortSignal | undefined, onFrame: (frame: DocsHelpFrame) => void): Promise<void> => {
  const res = await fetch('/api/docs-help', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  if (!res.ok || !res.body) {
    const detail: { error?: string } | null = await res.json().catch(() => null)
    throw new Error(detail?.error ?? `docs-help ${res.status}`)
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''
  const drain = (flush: boolean) => {
    for (let newline = buffer.indexOf('\n'); newline >= 0; newline = buffer.indexOf('\n')) {
      const line = buffer.slice(0, newline).trim()
      buffer = buffer.slice(newline + 1)
      if (line) onFrame(JSON.parse(line))
    }
    if (flush && buffer.trim()) onFrame(JSON.parse(buffer))
  }

  try {
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += value
      drain(false)
    }
    drain(true)
  } finally {
    await reader.cancel().catch(() => undefined)
  }
}

export const useDocsHelp = ({ query, prefer, section, summarize, enabled, seed }: DocsHelpParams) => {
  const queryClient = useQueryClient()
  const queryKey = ['docs-help', query, prefer, section, summarize]
  const placeholderData = useMemo<DocsHelpResponse | undefined>(() => (seed?.length ? { chunks: seed, summary: null } : undefined), [seed])

  return useQuery({
    queryKey,
    queryFn: async ({ signal }): Promise<DocsHelpResponse> => {
      const cached = queryClient.getQueryData<DocsHelpResponse>(queryKey)
      let result: DocsHelpResponse = { chunks: cached?.chunks ?? [], summary: cached?.summary ?? null }
      await readDocsHelp({ query, prefer, section, summarize }, signal, (frame) => {
        result = { chunks: frame.chunks ?? result.chunks, summary: frame.summary ?? result.summary }
        queryClient.setQueryData(queryKey, result)
      })
      return { chunks: result.chunks, summary: result.summary ?? '' }
    },
    placeholderData,
    enabled: enabled && !!query,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: (docsQuery) => (docsQuery.state.data?.summary === null ? 0 : DOCS_HELP_STALE_TIME_MS),
  })
}

// the section/title/full-page modes return a single json body rather than the
// streamed frames useDocsHelp consumes
async function postDocsHelp(body: object) {
  const res = await fetch('/api/docs-help', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`docs-help ${res.status}`)
  return res.json()
}

// Extract one named markdown section (e.g. "Evidence Requests") from the doc
// page best matching the query — prefer should pin the exact page. Inside a
// DocsSectionBatchProvider the lookup joins that batch instead of issuing its
// own request, so a long list makes one call rather than one per row
export function useDocsSection(query: string, extractSection: string | string[], enabled: boolean, prefer?: string) {
  const batch = use(DocsSectionBatchContext)
  const key = `${query}|${prefer ?? ''}|${Array.isArray(extractSection) ? extractSection.join(',') : extractSection}`

  useEffect(() => {
    if (batch.active && enabled && query) batch.request({ key, query, prefer, extractSection })
  }, [batch, enabled, query, key, prefer, extractSection])

  const solo = useQuery({
    queryKey: ['docs-help-section', query, prefer, extractSection],
    queryFn: async () => (await postDocsHelp({ query, prefer, extractSection })) as DocsSectionResult,
    enabled: !batch.active && enabled && !!query,
    staleTime: DOCS_HELP_STALE_TIME_MS,
    retry: false,
    placeholderData: undefined,
  })

  if (!batch.active) return solo
  const result = batch.results[key]
  return { data: result, isLoading: enabled && !!query && !result }
}

export type DocsControlTitleInput = { refCode?: string; description?: string }

// AI-written titles for docs example controls that arrived without a usable
// one; returns titles positionally, with '' where none could be generated
export function useDocsControlTitles(controls: DocsControlTitleInput[], enabled: boolean) {
  const key = controls.map((control) => `${control.refCode ?? ''}:${(control.description ?? '').slice(0, 80)}`).join('|')

  return useQuery({
    queryKey: ['docs-help-control-titles', key],
    queryFn: async () => ((await postDocsHelp({ suggestTitles: controls })).titles ?? []) as string[],
    enabled: enabled && controls.length > 0,
    retry: false,
    staleTime: DOCS_HELP_STALE_TIME_MS,
    placeholderData: undefined,
  })
}

// The whole extracted doc page, for expanding a chunk that retrieval cut off
export function useDocsFullPage(query: string, source: string | null, enabled: boolean, prefer?: string) {
  return useQuery({
    queryKey: ['docs-help-full-page', query, prefer, source],
    queryFn: async () => ((await postDocsHelp({ query, prefer, fullPageFor: source })).text ?? '') as string,
    enabled: enabled && !!query && !!source,
    retry: false,
    staleTime: DOCS_HELP_STALE_TIME_MS,
    placeholderData: undefined,
  })
}

export type PublicRepresentationRequest = {
  refCode?: string
  referenceFramework?: string
  description?: string
  implementations?: string[]
  objectives?: string[]
  existing?: string
}

export function useSuggestPublicRepresentation() {
  return useMutation({
    mutationFn: async (input: PublicRepresentationRequest) => ((await postDocsHelp({ suggestPublicRepresentation: input })).text ?? '') as string,
  })
}
