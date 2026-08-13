'use client'

import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react'

export type DocsHelpTopic = { title: string; query: string; prefer?: string; intro?: string }

const DocsHelpTopicContext = createContext<{ topic: DocsHelpTopic | null; setTopic: (t: DocsHelpTopic | null) => void }>({
  topic: null,
  setTopic: () => {},
})

export function DocsHelpTopicProvider({ children }: { children: ReactNode }) {
  const [topic, setTopic] = useState<DocsHelpTopic | null>(null)
  const value = useMemo(() => ({ topic, setTopic }), [topic])
  return <DocsHelpTopicContext value={value}>{children}</DocsHelpTopicContext>
}

export function useDocsHelpTopic() {
  return use(DocsHelpTopicContext).topic
}

export function useSetDocsHelpTopic(topic: DocsHelpTopic | null) {
  const { setTopic } = use(DocsHelpTopicContext)
  const key = topic ? JSON.stringify(topic) : ''
  useEffect(() => {
    if (!key) return
    setTopic(JSON.parse(key) as DocsHelpTopic)
    return () => setTopic(null)
  }, [key, setTopic])
}
