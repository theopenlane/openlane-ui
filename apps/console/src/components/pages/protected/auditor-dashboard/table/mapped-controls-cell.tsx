import React, { useMemo } from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { ControlChipList } from '@/components/shared/crud-base/columns/related-controls-cell'
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

  return <ControlChipList items={chips} />
}

export const MappedControlsCell = React.memo(MappedControlsCellComponent)
