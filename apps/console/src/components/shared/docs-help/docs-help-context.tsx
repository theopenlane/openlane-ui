'use client'

import { createContext, use, useCallback, useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'

export type DocsHelpTopic = { title: string; query: string; prefer?: string; intro?: string }

const DocsHelpTopicContext = createContext<DocsHelpTopic | null>(null)
const DocsHelpTopicSetterContext = createContext<Dispatch<SetStateAction<DocsHelpTopic | null>>>(() => {})

type DocsHelpDrawerState = {
  open: boolean
  setOpen: (open: boolean) => void
  modal: boolean
  pinned: boolean
  setPinned: (pinned: boolean) => void
  // a one-off topic pushed by an in-page action, cleared when the drawer closes
  ephemeralTopic: DocsHelpTopic | null
  setEphemeralTopic: (topic: DocsHelpTopic | null) => void
}

const DocsHelpDrawerContext = createContext<DocsHelpDrawerState>({
  open: false,
  setOpen: () => {},
  modal: false,
  pinned: false,
  setPinned: () => {},
  ephemeralTopic: null,
  setEphemeralTopic: () => {},
})

const PINNED_STORAGE_KEY = 'docs-help-pinned'

const modalLayerIsOpen = () => typeof document !== 'undefined' && (document.body.style.pointerEvents === 'none' || document.body.hasAttribute('data-scroll-locked'))

export const DocsHelpTopicProvider = ({ children }: { children: ReactNode }) => {
  const [topic, setTopic] = useState<DocsHelpTopic | null>(null)
  const [open, setOpen] = useState(false)
  const [modal, setModal] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [ephemeralTopic, setEphemeralTopic] = useState<DocsHelpTopic | null>(null)

  const pinPanel = useCallback((next: boolean) => {
    setPinned(next)
    if (next) setModal(false)
    try {
      localStorage.setItem(PINNED_STORAGE_KEY, String(next))
    } catch {
      return
    }
  }, [])

  useEffect(() => {
    try {
      if (localStorage.getItem(PINNED_STORAGE_KEY) !== 'true') return
    } catch {
      return
    }
    setPinned(true)
    setModal(false)
    setOpen(true)
  }, [])

  const openDrawer = useCallback(
    (next: boolean) => {
      if (!next && pinned) pinPanel(false)
      if (next) setModal(pinned ? false : modalLayerIsOpen())
      setOpen(next)
    },
    [pinned, pinPanel],
  )

  const drawer = useMemo(() => ({ open, setOpen: openDrawer, modal, pinned, setPinned: pinPanel, ephemeralTopic, setEphemeralTopic }), [open, openDrawer, modal, pinned, pinPanel, ephemeralTopic])

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
  const { open, setOpen, modal, pinned, setPinned } = use(DocsHelpDrawerContext)
  return { open, setOpen, modal, pinned, setPinned }
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
