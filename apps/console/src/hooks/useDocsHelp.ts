import { useQuery } from '@tanstack/react-query'
import type { DocsHelpResponse, DocsSection } from '@/types/docs-help'

type DocsHelpRequest = { query: string; prefer?: string; section?: DocsSection; summarize: boolean }

const postDocsHelp = async (body: DocsHelpRequest, signal?: AbortSignal): Promise<DocsHelpResponse> => {
  const res = await fetch('/api/docs-help', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  if (!res.ok) throw new Error(`docs-help ${res.status}`)
  const data: Partial<DocsHelpResponse> = await res.json()
  return { chunks: data.chunks ?? [], summary: data.summary ?? '' }
}

export const useDocsHelp = (query: string, enabled: boolean, summarize: boolean, prefer?: string, section?: DocsSection) =>
  useQuery({
    queryKey: ['docs-help', query, prefer, section, summarize],
    queryFn: ({ signal }) => postDocsHelp({ query, prefer, section, summarize }, signal),
    enabled: enabled && !!query,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
