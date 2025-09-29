import { useState } from 'react'
import { RelatedControlChip } from '../shared/related-control-chip'
import { Row } from '@tanstack/react-table'
import { ControlListFieldsFragment } from '@repo/codegen/src/schema'

type Props = {
  row: Row<ControlListFieldsFragment>
}
const SubcontrolCell = ({ row }: Props) => {
  const controlId = row.original.id
  const edges = row.original.subcontrols?.edges ?? []
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
        return <RelatedControlChip href={`/controls/${controlId}/${node.id}`} key={i} refCode={node.refCode} />
      })}
      {hasMore && (
        <button onClick={handleShowMore} className="text-xs text-brand bg-transparent px-1">
          Show more
        </button>
      )}
    </div>
  )
}

export default SubcontrolCell
