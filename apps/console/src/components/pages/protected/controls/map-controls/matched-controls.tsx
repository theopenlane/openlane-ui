import { ControlWhereInput, SubcontrolWhereInput } from '@repo/codegen/src/schema'
import React, { useMemo, useState } from 'react'
import MapControlCategoriesAccordion from './map-control-categories-accordion'
import { Button } from '@repo/ui/button'
import { ChevronsDownUp, List } from 'lucide-react'
import MapControlFrameworksAccordion from './map-control-frameworks-accordion'
import MapControlResults from './map-control-results'
import { MapControl } from '@/types'
import { ObjectTypes } from '@repo/codegen/src/type-names'

interface Props {
  controlData: (
    | {
        __typename?: typeof ObjectTypes.CONTROL
        id: string
        refCode: string
        category?: string | null
        subcategory?: string | null
        referenceFramework?: string | null
      }
    | null
    | undefined
  )[]
  subcontrolData:
    | {
        __typename?: typeof ObjectTypes.SUBCONTROL
        id: string
        refCode: string
        category?: string | null
        subcategory?: string | null
        referenceFramework?: string | null
      }[]
    | undefined
  droppedControls: MapControl[]
  where: ControlWhereInput | SubcontrolWhereInput
  isLoading?: boolean
  title: 'From' | 'To'
  setDroppedControls: React.Dispatch<React.SetStateAction<MapControl[]>>
}

const MatchedControls = ({ controlData, droppedControls, where, subcontrolData, isLoading, title, setDroppedControls }: Props) => {
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
    if (isLoading) {
      return <p>Loading...</p>
    }

    const queryFramework = !!where.referenceFramework || where.referenceFrameworkIsNil
    const queryKeywordOrCategory = !!where.or || !!where.and

    if (queryFramework && queryKeywordOrCategory) {
      return <MapControlResults droppedControls={droppedControls} controlData={controlData} subcontrolData={subcontrolData} title={title} setDroppedControls={setDroppedControls} />
    }
    if (queryFramework) {
      return (
        <MapControlCategoriesAccordion
          expandedItems={expandedItems}
          setExpandedItems={setExpandedItems}
          controlData={controlData}
          droppedControls={droppedControls}
          subcontrolData={subcontrolData}
          title={title}
          setDroppedControls={setDroppedControls}
        />
      )
    }

    if (queryKeywordOrCategory) {
      return (
        <MapControlFrameworksAccordion
          expandedItems={expandedItems}
          setExpandedItems={setExpandedItems}
          controlData={controlData}
          droppedControls={droppedControls}
          subcontrolData={subcontrolData}
          title={title}
          setDroppedControls={setDroppedControls}
        />
      )
    }

    return <div className="text-sm italic text-neutral-500">No available controls.</div>
  }, [controlData, droppedControls, expandedItems, where, subcontrolData, isLoading, title, setDroppedControls])

  return (
    <div className=" border-t pt-5">
      <div className="flex gap-4 items-center mb-4">
        <div className="flex items-center justify-between mb-2  ">
          <span className="w-full">Matched controls</span>
        </div>
        <Button type="button" className="h-8 !px-2" variant="secondary" disabled={!controlData} onClick={toggleAll}>
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
