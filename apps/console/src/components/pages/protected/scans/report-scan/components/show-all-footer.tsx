'use client'

import React, { useState } from 'react'
import { Button } from '@repo/ui/button'

export const useShowAll = <T,>(items: T[], limit: number) => {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? items : items.slice(0, limit)
  return { visible, hiddenCount: items.length - visible.length, expand: () => setShowAll(true) }
}

export const ShowAllFooter = ({ summary, onShowAll }: { summary: string; onShowAll: () => void }) => (
  <p className="text-sm text-muted-foreground">
    {summary} ·{' '}
    <Button variant="link" className="text-blue-500" onClick={onShowAll}>
      Show all
    </Button>
  </p>
)
