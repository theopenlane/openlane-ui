import { useQuery } from '@tanstack/react-query'
import type { DocsHelpChunk } from '@/app/api/docs-help/route'

async function postDocsHelp(body: object) {
  const res = await fetch('/api/docs-help', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`docs-help ${res.status}`)
  return res.json()
}

export type DocsSection = 'platform' | 'developers'

export function useDocsHelp(query: string, enabled: boolean, prefer?: string, section?: DocsSection) {
  return useQuery({
    queryKey: ['docs-help', query, prefer, section],
    queryFn: async () => ((await postDocsHelp({ query, prefer, section })).chunks ?? []) as DocsHelpChunk[],
    enabled: enabled && !!query,
    staleTime: 5 * 60 * 1000, // docs don't change mid-session
    placeholderData: undefined,
  })
}

// AI summary of the doc sections for a topic
export function useDocsSummary(query: string, enabled: boolean, prefer?: string, section?: DocsSection) {
  return useQuery({
    queryKey: ['docs-help-summary', query, prefer, section],
    queryFn: async () => {
      const summary = ((await postDocsHelp({ query, prefer, section, summarize: true })).summary ?? '') as string
      if (!summary) throw new Error('no summary')
      return summary
    },
    enabled: enabled && !!query,
    retry: false,
    staleTime: 5 * 60 * 1000,
    placeholderData: undefined,
  })
}
