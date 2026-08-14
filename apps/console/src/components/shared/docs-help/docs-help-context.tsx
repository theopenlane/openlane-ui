'use client'

import { createContext, use, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'

export type DocsHelpTopic = { title: string; query: string; prefer?: string; intro?: string }

const DocsHelpTopicContext = createContext<DocsHelpTopic | null>(null)
const DocsHelpTopicSetterContext = createContext<Dispatch<SetStateAction<DocsHelpTopic | null>>>(() => {})

export const DocsHelpTopicProvider = ({ children }: { children: ReactNode }) => {
  const [topic, setTopic] = useState<DocsHelpTopic | null>(null)
  return (
    <DocsHelpTopicSetterContext value={setTopic}>
      <DocsHelpTopicContext value={topic}>{children}</DocsHelpTopicContext>
    </DocsHelpTopicSetterContext>
  )
}

export const useDocsHelpTopic = () => use(DocsHelpTopicContext)

export const useSetDocsHelpTopic = (topic: DocsHelpTopic | null) => {
  const setTopic = use(DocsHelpTopicSetterContext)
  const { title, query, prefer, intro } = topic ?? {}

  useEffect(() => {
    if (!title || !query) return
    const owned: DocsHelpTopic = { title, query, prefer, intro }
    setTopic(owned)
    return () => setTopic((current) => (current === owned ? null : current))
  }, [title, query, prefer, intro, setTopic])
}
