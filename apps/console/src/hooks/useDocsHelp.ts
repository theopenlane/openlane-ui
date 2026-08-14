import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { DocsHelpChunk, DocsHelpFrame, DocsHelpResponse, DocsSection } from '@/types/docs-help'

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
