'use client'

import React, { useState } from 'react'

type ShowMoreProps<T> = {
  items: T[]
  renderItem: (item: T) => React.ReactNode
  limit?: number
}

const ShowMore = <T,>({ items, renderItem, limit = 3 }: ShowMoreProps<T>) => {
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

export default ShowMore
