import React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { GetMappedControlsQuery, MappedControlMappingType } from '@repo/codegen/src/schema'
import RelationCard from './mapped-relations-card'

type MappedRelationsSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  queryData: GetMappedControlsQuery
}

const MappedRelationsSheet: React.FC<MappedRelationsSheetProps> = ({ open, onOpenChange, queryData }) => {
  const mappings = queryData?.mappedControls?.edges?.map((e) => e?.node).filter(Boolean)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="bg-card flex flex-col"
        header={
          <SheetHeader>
            <SheetTitle className="self-start">Mapped relationships</SheetTitle>
          </SheetHeader>
        }
      >
        {(!mappings || mappings.length === 0) && <p className="text-sm mt-4">No mapping data available.</p>}

        {mappings?.map((mapping, i) => {
          const from: Record<string, string[]> = {}
          const to: Record<string, string[]> = {}

          const addToMap = (map: Record<string, string[]>, framework: string, refCode: string) => {
            if (!map[framework]) map[framework] = []
            if (!map[framework].includes(refCode)) map[framework].push(refCode)
          }

          const allFrom = [...(mapping?.fromControls?.edges || []), ...(mapping?.fromSubcontrols?.edges || [])]
          const allTo = [...(mapping?.toControls?.edges || []), ...(mapping?.toSubcontrols?.edges || [])]

          allFrom.forEach((e) => {
            if (e?.node) {
              const framework = e.node.referenceFramework || 'CUSTOM'
              addToMap(from, framework, e.node.refCode)
            }
          })

          allTo.forEach((e) => {
            if (e?.node) {
              const framework = e.node.referenceFramework || 'CUSTOM'
              addToMap(to, framework, e.node.refCode)
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
