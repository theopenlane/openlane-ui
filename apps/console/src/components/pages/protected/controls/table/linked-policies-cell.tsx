import { useState } from 'react'
import { Row } from '@tanstack/react-table'
import { ControlListFieldsFragment } from '@repo/codegen/src/schema'
import { Badge } from '@repo/ui/badge'
import Link from 'next/link'

type Props = {
  row: Row<ControlListFieldsFragment>
}

export function LinkedPoliciesCell({ row }: Props) {
  const edges = row.original.internalPolicies?.edges ?? []
  const [visibleCount, setVisibleCount] = useState(5)

  if (!edges.length) return <div>-</div>

  const handleShowMore = (e: React.MouseEvent) => {
    e.stopPropagation()
    setVisibleCount((prev) => prev + 5)
  }

  const visibleEdges = edges.slice(0, visibleCount)
  const hasMore = visibleCount < edges.length

  return (
    <div className="flex flex-wrap gap-2">
      {visibleEdges.map((edge, i) => {
        const node = edge?.node
        if (!node) return null

        return (
          <Link key={node.id ?? i} href={`/policies/${node.id}/view`} onClick={(e) => e.stopPropagation()}>
            <Badge variant="outline">{node.name}</Badge>
          </Link>
        )
      })}

      {hasMore && (
        <button onClick={handleShowMore} className="text-xs text-brand bg-transparent px-1">
          Show more
        </button>
      )}
    </div>
  )
}
