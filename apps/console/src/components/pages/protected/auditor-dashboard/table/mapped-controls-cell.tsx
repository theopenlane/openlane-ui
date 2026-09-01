import React, { useMemo } from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import ShowMore from '@/components/shared/show-more/show-more'
import ControlChip from '@/components/pages/protected/controls/map-controls/shared/control-chip'
import { type MapControl } from '@/types'
import { type AuditorDashboardRelatedControl } from '@/lib/graphql-hooks/control'

type MappedControlsCellProps = {
  items: AuditorDashboardRelatedControl[]
}

const MappedControlsCellComponent: React.FC<MappedControlsCellProps> = ({ items }) => {
  const chips = useMemo<MapControl[]>(
    () =>
      items.map((item) => ({
        __typename: item.isSubcontrol ? ObjectTypes.SUBCONTROL : ObjectTypes.CONTROL,
        id: item.id,
        refCode: item.refCode,
        referenceFramework: item.referenceFramework,
        controlID: item.parentControlID,
      })),
    [items],
  )

  if (chips.length === 0) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <div className="flex flex-wrap items-center gap-1" onClick={(event) => event.stopPropagation()}>
      <ShowMore items={chips} renderItem={(chip) => <ControlChip key={chip.id} control={chip} />} />
    </div>
  )
}

export const MappedControlsCell = React.memo(MappedControlsCellComponent)
