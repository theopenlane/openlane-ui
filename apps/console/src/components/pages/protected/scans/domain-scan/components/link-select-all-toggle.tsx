'use client'

import React from 'react'
import { Button } from '@repo/ui/button'
import { getLinkedIds, setAllLinked, type LinkMap } from '../selection-utils'

type LinkSelectAllToggleProps = {
  targetId: string
  ids: string[]
  links: LinkMap
  setLinks: React.Dispatch<React.SetStateAction<LinkMap>>
  defaultIds?: string[]
}

export const LinkSelectAllToggle = ({ targetId, ids, links, setLinks, defaultIds = [] }: LinkSelectAllToggleProps) => {
  if (ids.length === 0) return null

  const linkedIds = getLinkedIds(links, targetId, defaultIds)
  const allLinked = ids.every((id) => linkedIds.has(id))

  return (
    <Button variant="secondary" onClick={() => setAllLinked(setLinks, targetId, ids, !allLinked)}>
      {allLinked ? 'Deselect all' : 'Select all'}
    </Button>
  )
}
