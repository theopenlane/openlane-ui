import React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { GetAllMappedControlsQuery, MappedControlMappingSource, MappedControlMappingType, MappedControlsFragmentFragment, MappedSubcontrolsFragmentFragment } from '@repo/codegen/src/schema'
import RelationCard from './mapped-relations-card'
import { useGetControlsByRefCode } from '@/lib/graphql-hooks/controls'
import { useGetSubcontrolsByRefCode } from '@/lib/graphql-hooks/subcontrol'

type MappedRelationsSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  queryData: GetAllMappedControlsQuery
}

const MappedRelationsSheet: React.FC<MappedRelationsSheetProps> = ({ open, onOpenChange, queryData }) => {
  const mappings = queryData?.mappedControls?.edges?.filter((e) => e?.node?.source !== MappedControlMappingSource.SUGGESTED).map((e) => e?.node)

  const controlRefCodes = new Set<string>()
  const subcontrolRefCodes = new Set<string>()

  mappings?.forEach((mapping) => {
    mapping?.fromControls?.edges?.forEach((e) => e?.node?.refCode && controlRefCodes.add(e.node.refCode))
    mapping?.toControls?.edges?.forEach((e) => e?.node?.refCode && controlRefCodes.add(e.node.refCode))
    mapping?.fromSubcontrols?.edges?.forEach((e) => e?.node?.refCode && subcontrolRefCodes.add(e.node.refCode))
    mapping?.toSubcontrols?.edges?.forEach((e) => e?.node?.refCode && subcontrolRefCodes.add(e.node.refCode))
  })
  const allControlRefCodes = Array.from(controlRefCodes)
  const allSubcontrolRefCodes = Array.from(subcontrolRefCodes)

  const { data: refcodeData } = useGetControlsByRefCode({ refCodeIn: allControlRefCodes })
  const { data: subcontrolRefcodeData } = useGetSubcontrolsByRefCode({ refCodeIn: allSubcontrolRefCodes })

  const controlHrefMap: Record<string, string> = {}
  const subcontrolHrefMap: Record<string, string> = {}

  refcodeData?.controls?.edges?.forEach((edge) => {
    const node = edge?.node
    if (!node) return

    if (!node.systemOwned) {
      controlHrefMap[node.refCode] = `/controls/${node.id}`
    } else if (node.standardID) {
      controlHrefMap[node.refCode] = `/standards/${node.standardID}?controlId=${node.id}`
    }
  })

  subcontrolRefcodeData?.subcontrols?.edges?.forEach((edge) => {
    const node = edge?.node
    if (!node) return

    if (!node.systemOwned) {
      subcontrolHrefMap[node.refCode] = `/controls/${node.controlID}/${node.id}`
    } else if (node.control?.standardID) {
      subcontrolHrefMap[node.refCode] = `/standards/${node.control.standardID}?controlId=${node.id}`
    }
  })

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
              controlHrefMap={controlHrefMap}
              subcontrolHrefMap={subcontrolHrefMap}
            />
          )
        })}
      </SheetContent>
    </Sheet>
  )
}

export default MappedRelationsSheet
