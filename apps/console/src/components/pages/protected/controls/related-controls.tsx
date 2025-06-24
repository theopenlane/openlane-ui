import React, { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useGetMappedControls } from '@/lib/graphql-hooks/mapped-control'
import { Button } from '@repo/ui/button'
import { ChevronsLeftRightEllipsis, PanelRightOpen, PencilLine } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'
import Link from 'next/link'
import MappedRelationsSheet from './mapped-relationships-sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { MappingIconMapper } from '@/components/shared/icon-enum/map-control-enum'

export type RelatedNode = {
  type: 'Control' | 'Subcontrol'
  id: string
  refCode: string
  referenceFramework?: string | null
  controlId?: string
}

export type GroupedControls = Record<string, RelatedNode[]>

const RelatedControls = () => {
  const { id, subcontrolId } = useParams<{ id: string; subcontrolId: string }>()
  const [sheetOpen, setSheetOpen] = useState(false)

  const where = useMemo(
    () =>
      subcontrolId
        ? { or: [{ hasFromSubcontrolsWith: [{ id: subcontrolId }] }, { hasToSubcontrolsWith: [{ id: subcontrolId }] }] }
        : id
        ? { or: [{ hasFromControlsWith: [{ id }] }, { hasToControlsWith: [{ id }] }] }
        : undefined,
    [id, subcontrolId],
  )

  const { data } = useGetMappedControls(where)

  const grouped: GroupedControls = {}
  data?.mappedControls?.edges?.forEach((edge) => {
    const node = edge?.node
    if (!node) return

    const isFromControl = node.fromControls?.edges?.some((e) => e?.node?.id === id)
    const isFromSub = node.fromSubcontrols?.edges?.some((e) => e?.node?.id === id)
    const isToControl = node.toControls?.edges?.some((e) => e?.node?.id === id)
    const isToSub = node.toSubcontrols?.edges?.some((e) => e?.node?.id === id)

    const opposite: RelatedNode[] = []

    if (isFromControl || isFromSub) {
      opposite.push(
        ...(node
          .toControls!.edges!.map((e) =>
            e?.node
              ? {
                  type: 'Control',
                  id: e.node.id,
                  refCode: e.node.refCode,
                  referenceFramework: e.node.referenceFramework,
                }
              : null,
          )
          .filter(Boolean) as RelatedNode[]),
        ...(node
          .toSubcontrols!.edges!.map((e) =>
            e?.node
              ? {
                  type: 'Subcontrol',
                  id: e.node.id,
                  refCode: e.node.refCode,
                  referenceFramework: e.node.referenceFramework,
                  controlId: e.node.control.id,
                }
              : null,
          )
          .filter(Boolean) as RelatedNode[]),
      )
    } else if (isToControl || isToSub) {
      opposite.push(
        ...(node
          .fromControls!.edges!.map((e) =>
            e?.node
              ? {
                  type: 'Control',
                  id: e.node.id,
                  refCode: e.node.refCode,
                  referenceFramework: e.node.referenceFramework,
                }
              : null,
          )
          .filter(Boolean) as RelatedNode[]),
        ...(node
          .fromSubcontrols!.edges!.map((e) =>
            e?.node
              ? {
                  type: 'Subcontrol',
                  id: e.node.id,
                  refCode: e.node.refCode,
                  referenceFramework: e.node.referenceFramework,
                  controlId: e.node.control.id,
                }
              : null,
          )
          .filter(Boolean) as RelatedNode[]),
      )
    }

    opposite.forEach((n) => {
      const key = n.referenceFramework || 'CUSTOM'
      if (!grouped[key]) grouped[key] = []
      if (!grouped[key].some((ex) => ex.refCode === n.refCode)) grouped[key].push(n)
    })
  })

  if (!data) {
    return null
  }

  return (
    <>
      <Card className="p-4">
        <div className="flex justify-between items-center mb-5">
          <p className="text-lg">Related Controls</p>
          <Button type="button" className="h-8 p-2" variant="outline" icon={<PanelRightOpen />} onClick={() => setSheetOpen(true)}>
            View
          </Button>
        </div>

        {/* ← Here’s your existing chips rendering */}
        {Object.entries(grouped).map(([framework, nodes], idx, arr) => (
          <div key={framework} className={`mb-2 flex gap-5 items-center py-2 ${index < array.length - 1 ? 'border-b' : ''}`}>
            <h3 className="font-semibold min-w-24 text-text-informational">{framework}</h3>
            <div className="flex gap-2.5 flex-wrap">
              {nodes.map((node, i) => {
                const href = node.type === 'Subcontrol' ? `/controls/${node.controlId}/${node.id}` : `/controls/${node.id}`
                return (
                  <TooltipProvider key={i}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href={href}>
                          <span className="text-xs border rounded-full cursor-pointer hover:text-brand px-2.5 py-0.5">{node.refCode}</span>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <div className="flex flex-col gap-1">
                          <div className="flex gap-1 items-center border-b">
                            <ChevronsLeftRightEllipsis size={12} />
                            <span>Mapping type</span>
                            <div className="ml-4 flex w-2.5 justify-center items-center">{node.mappingType && MappingIconMapper[node.mappingType]}</div>
                            <span className="capitalize">{node.mappingType.toLowerCase()}</span>
                          </div>
                          <div className="flex gap-1 items-center">
                            <PencilLine size={12} />
                            <span>Relation Description</span>
                          </div>
                          <span className="line-clamp-4">{node.relation}</span>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              })}
            </div>
          </div>
        ))}
      </Card>

      <MappedRelationsSheet open={sheetOpen} onOpenChange={setSheetOpen} queryData={data} />
    </>
  )
}

export default RelatedControls
