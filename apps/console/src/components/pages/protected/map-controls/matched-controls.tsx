import { ControlWhereInput, GetControlSelectOptionsQuery, GetSubcontrolSelectOptionsQuery, SubcontrolWhereInput } from '@repo/codegen/src/schema'
import React, { useMemo, useState } from 'react'
import { DroppedControl } from './map-controls-card'
import MapControlCategoriesAccordion from './map-control-categories-accordion'
import { Button } from '@repo/ui/button'
import { ChevronsDownUp, List } from 'lucide-react'
import MapControlFrameworksAccordion from './map-control-frameworks-accordion'
import MapControlResults from './map-control-results'

interface Props {
  controlData: (
    | {
        __typename?: 'Control'
        id: string
        refCode: string
        category?: string | null
        subcategory?: string | null
        referenceFramework?: string | null
      }
    | null
    | undefined
  )[]
  subcontrolData?: GetSubcontrolSelectOptionsQuery
  droppedControls: DroppedControl[]
  where: ControlWhereInput | SubcontrolWhereInput
}

const MatchedControls = ({ controlData, droppedControls, where, subcontrolData }: Props) => {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const toggleAll = () => {
    const allOpen = Object.values(expandedItems).every((val) => val)
    const toggledState: Record<string, boolean> = {}
    Object.keys(expandedItems).forEach((key) => {
      toggledState[key] = !allOpen
    })
    setExpandedItems(toggledState)
  }

  const content = useMemo(() => {
    if (where.referenceFramework && where.or) {
      return <MapControlResults droppedControls={droppedControls} controlData={controlData} subcontrolData={subcontrolData} />
    }
    if (where.referenceFramework) {
      return (
        <MapControlCategoriesAccordion expandedItems={expandedItems} setExpandedItems={setExpandedItems} controlData={controlData} droppedControls={droppedControls} subcontrolData={subcontrolData} />
      )
    }

    if (where.or) {
      return (
        <MapControlFrameworksAccordion expandedItems={expandedItems} setExpandedItems={setExpandedItems} controlData={controlData} droppedControls={droppedControls} subcontrolData={subcontrolData} />
      )
    }

    return <p className="mt-5">At least one keyword required</p>
  }, [controlData, droppedControls, expandedItems, where, subcontrolData])

  return (
    <div className=" border-t pt-5">
      <div className="flex gap-4 items-center ">
        <div className="flex items-center justify-between mb-2  ">
          <span className="w-full">Matched controls</span>
        </div>
        <Button type="button" className="h-8 !px-2" variant="outline" disabled={!controlData} onClick={toggleAll}>
          <div className="flex">
            <List size={16} />
            <ChevronsDownUp size={16} />
          </div>
        </Button>
      </div>
      {content}
    </div>
  )
}

export default MatchedControls
