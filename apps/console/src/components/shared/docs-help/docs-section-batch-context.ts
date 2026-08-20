'use client'

import { createContext } from 'react'

export type DocsSectionResult = { section: string; title: string; source: string }

export type DocsSectionLookup = { key: string; query: string; prefer?: string; extractSection: string | string[] }

export type BatchState = {
  // ask for a lookup; returns nothing until the next batch resolves
  request: (lookup: DocsSectionLookup) => void
  results: Record<string, DocsSectionResult>
  // true while a batch containing this key is in flight
  pending: (key: string) => boolean
  // true once the batch carrying this key failed — the result will never arrive
  errored: (key: string) => boolean
  active: boolean
}

export const DocsSectionBatchContext = createContext<BatchState>({
  request: () => {},
  results: {},
  pending: () => false,
  errored: () => false,
  active: false,
})
