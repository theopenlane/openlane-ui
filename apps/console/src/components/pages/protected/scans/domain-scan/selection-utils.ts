import type React from 'react'

export type LinkMap = Record<string, Set<string>>

export type LinkRecord = Record<string, string[]>

export const toggleSetValue = (setState: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) => {
  setState((prev) => {
    const next = new Set(prev)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    return next
  })
}

export const setAllSelected = (setState: React.Dispatch<React.SetStateAction<Set<string>>>, ids: string[], selected: boolean) => {
  setState((prev) => {
    const next = new Set(prev)
    ids.forEach((id) => (selected ? next.add(id) : next.delete(id)))
    return next
  })
}

export const toggleLinkValue = (setLinks: React.Dispatch<React.SetStateAction<LinkMap>>, targetId: string, itemId: string, defaultIds: string[] = []) => {
  setLinks((prev) => {
    const current = prev[targetId] ? new Set(prev[targetId]) : new Set(defaultIds)
    if (current.has(itemId)) {
      current.delete(itemId)
    } else {
      current.add(itemId)
    }
    return { ...prev, [targetId]: current }
  })
}

export const getLinkedIds = (links: LinkMap, targetId: string, defaultIds: string[] = []) => links[targetId] ?? new Set(defaultIds)

export const setAllLinked = (setLinks: React.Dispatch<React.SetStateAction<LinkMap>>, targetId: string, ids: string[], linked: boolean) => {
  setLinks((prev) => ({ ...prev, [targetId]: new Set(linked ? ids : []) }))
}

export const resolveLinkedRefs = (links: LinkMap, targetId: string, defaultIds: string[], allowedIds: Set<string>) =>
  Array.from(getLinkedIds(links, targetId, defaultIds)).filter((id) => allowedIds.has(id))

export const linkSetsToRecord = (links: LinkMap): LinkRecord => Object.fromEntries(Object.entries(links).map(([key, value]) => [key, Array.from(value)]))

export const linkSetsFromRecord = (record: LinkRecord): LinkMap => Object.fromEntries(Object.entries(record).map(([key, value]) => [key, new Set(value)]))
