import { GetControlSelectOptionsQuery } from '@repo/codegen/src/schema'
import React, { useMemo, useState } from 'react'
import { DroppedControl } from './map-controls-card'
import MapControlCategoriesAccordion from './map-control-categories-accordion'
import { Button } from '@repo/ui/button'
import { ChevronsDownUp, List } from 'lucide-react'

interface Props {
  controlsData: GetControlSelectOptionsQuery | undefined
  droppedControls: DroppedControl[]
}

const MatchedControls = ({ controlsData, droppedControls }: Props) => {
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
    if (!controlsData) {
      return <p className="mt-5">At least one keyword required</p>
    }
    return <MapControlCategoriesAccordion expandedItems={expandedItems} setExpandedItems={setExpandedItems} controlsData={controlsData} droppedControls={droppedControls} />
  }, [controlsData, droppedControls, expandedItems])

  return (
    <div className=" border-t pt-5">
      <div className="flex gap-4 items-center ">
        <div className="flex items-center justify-between mb-2  ">
          <span className="w-full">Matched controls</span>
        </div>
        <Button type="button" className="h-8 !px-2" variant="outline" disabled={!controlsData} onClick={toggleAll}>
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
