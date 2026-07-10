'use client'

import React, { useState } from 'react'

type ReportShowMoreProps<T> = {
  items: T[]
  renderItem: (item: T) => React.ReactNode
  limit?: number
}

const ReportShowMore = <T,>({ items, renderItem, limit = 3 }: ReportShowMoreProps<T>) => {
  const [expanded, setExpanded] = useState(false)
  const visibleItems = expanded ? items : items.slice(0, limit)
  const hiddenCount = items.length - visibleItems.length

  return (
    <>
      {visibleItems.map(renderItem)}
      {items.length > limit && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setExpanded((prev) => !prev)
          }}
          className="text-xs text-brand hover:underline px-1"
        >
          {expanded ? 'Show less' : `+${hiddenCount} more`}
        </button>
      )}
    </>
  )
}

export default ReportShowMore
