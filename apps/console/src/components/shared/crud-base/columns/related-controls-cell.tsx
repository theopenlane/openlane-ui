import React, { useMemo } from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import ControlChip from '@/components/pages/protected/controls/map-controls/shared/control-chip'
import ShowMore from '@/components/shared/show-more/show-more'
import { type MapControl } from '@/types'

type RelatedControlEdge = {
  node?: {
    id: string
    refCode: string
    referenceFramework?: string | null
    controlID?: string | null
  } | null
} | null

type ControlChipListProps = {
  items: MapControl[]
}

export const ControlChipList: React.FC<ControlChipListProps> = ({ items }) => {
  if (items.length === 0) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <div role="presentation" className="flex flex-wrap items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <ShowMore items={items} renderItem={(item) => <ControlChip key={item.id} control={item} />} />
    </div>
  )
}

type RelatedControlsCellProps = {
  controlEdges?: RelatedControlEdge[] | null
  subcontrolEdges?: RelatedControlEdge[] | null
}

const toChips = (edges: RelatedControlEdge[] | null | undefined, __typename: MapControl['__typename']): MapControl[] =>
  (edges ?? []).flatMap((edge) => (edge?.node ? [{ __typename, id: edge.node.id, refCode: edge.node.refCode, referenceFramework: edge.node.referenceFramework, controlID: edge.node.controlID }] : []))

const RelatedControlsCellComponent: React.FC<RelatedControlsCellProps> = ({ controlEdges, subcontrolEdges }) => {
  const chips = useMemo(() => [...toChips(controlEdges, ObjectTypes.CONTROL), ...toChips(subcontrolEdges, ObjectTypes.SUBCONTROL)], [controlEdges, subcontrolEdges])

  return <ControlChipList key={chips.map((chip) => chip.id).join()} items={chips} />
}

export const RelatedControlsCell = React.memo(RelatedControlsCellComponent)
