import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useGetMappedControls } from '@/lib/graphql-hooks/mapped-control'
import { Button } from '@repo/ui/button'
import { PanelRightOpen } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'

export type RelatedNode = {
  type: 'Control' | 'Subcontrol'
  id: string
  refCode: string
  referenceFramework?: string | null
  controlId?: string
}

export type GroupedControls = Record<string, RelatedNode[]>

const RelatedControls = () => {
  const router = useRouter()
  const { id, subcontrolId } = useParams<{ id: string; subcontrolId: string }>()

  const where = subcontrolId
    ? {
        or: [{ hasFromSubcontrolsWith: [{ id: subcontrolId }] }, { hasToSubcontrolsWith: [{ id: subcontrolId }] }],
      }
    : id
    ? {
        or: [{ hasFromControlsWith: [{ id }] }, { hasToControlsWith: [{ id }] }],
      }
    : undefined

  const { data } = useGetMappedControls(where)

  const grouped: GroupedControls = {}

  data?.mappedControls?.edges?.forEach((edge) => {
    const node = edge?.node
    if (!node) return

    const isFromControl = node?.fromControls?.edges?.some((e) => e?.node?.id === id)
    const isFromSub = node?.fromSubcontrols?.edges?.some((e) => e?.node?.id === id)
    const isToControl = node?.toControls?.edges?.some((e) => e?.node?.id === id)
    const isToSub = node?.toSubcontrols?.edges?.some((e) => e?.node?.id === id)

    const oppositeNodes: RelatedNode[] = []

    if (isFromControl || isFromSub) {
      oppositeNodes.push(
        ...(node?.toControls?.edges
          ?.map((e) =>
            e?.node
              ? {
                  type: 'Control',
                  id: e.node.id,
                  refCode: e.node.refCode,
                  referenceFramework: e.node.referenceFramework,
                }
              : null,
          )
          .filter(Boolean) as typeof oppositeNodes),
        ...(node?.toSubcontrols?.edges
          ?.map((e) =>
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
          .filter(Boolean) as typeof oppositeNodes),
      )
    } else if (isToControl || isToSub) {
      oppositeNodes.push(
        ...(node?.fromControls?.edges
          ?.map((e) =>
            e?.node
              ? {
                  type: 'Control',
                  id: e.node.id,
                  refCode: e.node.refCode,
                  referenceFramework: e.node.referenceFramework,
                }
              : null,
          )
          .filter(Boolean) as typeof oppositeNodes),
        ...(node?.fromSubcontrols?.edges
          ?.map((e) =>
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
          .filter(Boolean) as typeof oppositeNodes),
      )
    }

    oppositeNodes.forEach((n) => {
      const key = n.referenceFramework || 'CUSTOM'
      if (!grouped[key]) grouped[key] = []
      if (!grouped[key].some((existing) => existing.refCode === n.refCode)) {
        grouped[key].push(n)
      }
    })
  })

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-5">
        <p className="text-lg">Related Controls</p>
        <Button type="button" className="h-8 p-2" variant="outline" icon={<PanelRightOpen />}>
          View
        </Button>
      </div>

      {Object.entries(grouped).map(([framework, nodes], index, array) => (
        <div key={framework} className={`mb-4 flex gap-5 items-center py-2 ${index < array.length - 1 ? 'border-b' : ''}`}>
          <h3 className="font-semibold min-w-24 text-text-informational">{framework}</h3>
          <div className="flex gap-2.5 flex-wrap">
            {nodes.map((node) => {
              const href = node.type === 'Subcontrol' ? `/controls/${node.controlId}/${node.id}` : `/controls/${node.id}`
              return (
                <span key={node.refCode} onClick={() => router.push(href)} className="text-xs border rounded-full cursor-pointer hover:text-brand px-2.5 py-0.5">
                  {node.refCode}
                </span>
              )
            })}
          </div>
        </div>
      ))}
    </Card>
  )
}

export default RelatedControls
