import React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { GetMappedControlsQuery, MappedControlMappingSource, MappedControlMappingType, MappedControlsFragmentFragment, MappedSubcontrolsFragmentFragment } from '@repo/codegen/src/schema'
import RelationCard from './mapped-relations-card'

type MappedRelationsSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  queryData: GetMappedControlsQuery
}

const MappedRelationsSheet: React.FC<MappedRelationsSheetProps> = ({ open, onOpenChange, queryData }) => {
  const mappings = queryData?.mappedControls?.edges?.filter((e) => e?.node?.source !== MappedControlMappingSource.SUGGESTED).map((e) => e?.node)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="flex flex-col"
        header={
          <SheetHeader>
            <SheetTitle className="self-start">Mapped relationships</SheetTitle>
          </SheetHeader>
        }
      >
        {(!mappings || mappings.length === 0) && <p className="text-sm mt-4">No mapping data available.</p>}

        {mappings?.map((mapping, i) => {
          const from: Record<string, (MappedControlsFragmentFragment | MappedSubcontrolsFragmentFragment)[]> = {}
          const to: Record<string, (MappedControlsFragmentFragment | MappedSubcontrolsFragmentFragment)[]> = {}

          const addToMap = (
            map: Record<string, (MappedControlsFragmentFragment | MappedSubcontrolsFragmentFragment)[]>,
            framework: string,
            node: MappedControlsFragmentFragment | MappedSubcontrolsFragmentFragment,
          ) => {
            if (!node) return
            if (!map[framework]) map[framework] = []
            if (!map[framework].some((n) => n.id === node.id)) {
              map[framework].push(node)
            }
          }

          const allFrom = [...(mapping?.fromControls?.edges || []), ...(mapping?.fromSubcontrols?.edges || [])]
          const allTo = [...(mapping?.toControls?.edges || []), ...(mapping?.toSubcontrols?.edges || [])]
          allFrom.forEach((e) => {
            if (e?.node) {
              const framework = e.node.referenceFramework || 'CUSTOM'
              addToMap(from, framework, e.node)
            }
          })

          allTo.forEach((e) => {
            if (e?.node) {
              const framework = e.node.referenceFramework || 'CUSTOM'
              addToMap(to, framework, e.node)
            }
          })

          return (
            <RelationCard
              key={i}
              data={{
                from,
                to,
                type: mapping?.mappingType as MappedControlMappingType,
                confidence: mapping?.confidence ?? 0,
                relation: mapping?.relation ?? '',
                id: mapping?.id ?? '',
              }}
            />
          )
        })}
      </SheetContent>
    </Sheet>
  )
}

export default MappedRelationsSheet
