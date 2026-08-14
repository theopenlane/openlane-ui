'use client'

import { createContext, use, useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'

export type DocsHelpTopic = { title: string; query: string; prefer?: string; intro?: string }

const DocsHelpTopicContext = createContext<DocsHelpTopic | null>(null)
const DocsHelpTopicSetterContext = createContext<Dispatch<SetStateAction<DocsHelpTopic | null>>>(() => {})

type DocsHelpDrawerState = {
  open: boolean
  setOpen: (open: boolean) => void
  // a one-off topic pushed by an in-page action, cleared when the drawer closes
  ephemeralTopic: DocsHelpTopic | null
  setEphemeralTopic: (topic: DocsHelpTopic | null) => void
}

const DocsHelpDrawerContext = createContext<DocsHelpDrawerState>({
  open: false,
  setOpen: () => {},
  ephemeralTopic: null,
  setEphemeralTopic: () => {},
})

export const DocsHelpTopicProvider = ({ children }: { children: ReactNode }) => {
  const [topic, setTopic] = useState<DocsHelpTopic | null>(null)
  const [open, setOpen] = useState(false)
  const [ephemeralTopic, setEphemeralTopic] = useState<DocsHelpTopic | null>(null)
  const drawer = useMemo(() => ({ open, setOpen, ephemeralTopic, setEphemeralTopic }), [open, ephemeralTopic])

  return (
    <DocsHelpTopicSetterContext value={setTopic}>
      <DocsHelpTopicContext value={topic}>
        <DocsHelpDrawerContext value={drawer}>{children}</DocsHelpDrawerContext>
      </DocsHelpTopicContext>
    </DocsHelpTopicSetterContext>
  )
}

export const useDocsHelpTopic = () => use(DocsHelpTopicContext)

// open/close the global docs drawer from anywhere, e.g. an in-page docs link
export function useDocsHelpDrawer() {
  const { open, setOpen } = use(DocsHelpDrawerContext)
  return { open, setOpen }
}

// open the docs drawer on a specific topic (one-off, cleared on close)
export function useDocsHelpNavigate() {
  const { setOpen, setEphemeralTopic } = use(DocsHelpDrawerContext)
  return (topic: DocsHelpTopic) => {
    setEphemeralTopic(topic)
    setOpen(true)
  }
}

export function useDocsHelpEphemeralTopic() {
  const { ephemeralTopic, setEphemeralTopic } = use(DocsHelpDrawerContext)
  return { ephemeralTopic, setEphemeralTopic }
}

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
