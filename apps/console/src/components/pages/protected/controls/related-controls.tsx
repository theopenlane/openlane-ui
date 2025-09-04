import React, { useEffect, useState } from 'react'
import { useParams, usePathname, useSearchParams } from 'next/navigation'
import { useGetMappedControls } from '@/lib/graphql-hooks/mapped-control'
import { Button } from '@repo/ui/button'
import { PanelRightOpen } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'
import { MappedControlMappingType } from '@repo/codegen/src/schema'
import MappedRelationsSheet from './mapped-relationships-sheet'
import { RelatedControlChip } from './shared/related-control-chip'
import Link from 'next/link'
import StandardChip from '../standards/shared/standard-chip'

export type RelatedNode = {
  type: 'Control' | 'Subcontrol'
  id: string
  refCode: string
  referenceFramework?: string | null
  controlId?: string
  mappingType: MappedControlMappingType
  relation?: string | null
}

export type GroupedControls = Record<string, RelatedNode[]>

type Props = {
  canCreate: boolean
}

const RelatedControls = ({ canCreate }: Props) => {
  const { id, subcontrolId } = useParams<{ id: string; subcontrolId: string }>()
  const [sheetOpen, setSheetOpen] = useState(false)
  const searchParams = useSearchParams()
  const openRelationsParam = searchParams.get('openRelations') === 'true'
  const path = usePathname()

  const where = subcontrolId
    ? {
        or: [{ hasFromSubcontrolsWith: [{ id: subcontrolId }] }, { hasToSubcontrolsWith: [{ id: subcontrolId }] }],
      }
    : id
    ? {
        or: [{ hasFromControlsWith: [{ id }] }, { hasToControlsWith: [{ id }] }],
      }
    : undefined

  const { data } = useGetMappedControls({ where, enabled: !!where })

  const grouped: GroupedControls = {}

  data?.mappedControls?.edges?.forEach((edge) => {
    const node = edge?.node
    if (!node) return

    const currentId = subcontrolId ? subcontrolId : id

    const isFromControl = node?.fromControls?.edges?.some((e) => e?.node?.id === currentId)
    const isFromSub = node?.fromSubcontrols?.edges?.some((e) => e?.node?.id === currentId)
    const isToControl = node?.toControls?.edges?.some((e) => e?.node?.id === currentId)
    const isToSub = node?.toSubcontrols?.edges?.some((e) => e?.node?.id === currentId)

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
                  mappingType: node.mappingType,
                  relation: node.relation,
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
                  controlId: e.node.controlID,
                  mappingType: node.mappingType,
                  relation: node.relation,
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
                  mappingType: node.mappingType,
                  relation: node.relation,
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
                  controlId: e.node.controlID,
                  mappingType: node.mappingType,
                  relation: node.relation,
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

  useEffect(() => {
    if (openRelationsParam) {
      setSheetOpen(true)
    }
  }, [openRelationsParam])

  if (!data) {
    return null
  }
  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-5">
        <p className="text-lg">Related Controls</p>
        {Object.keys(grouped).length > 0 ? (
          <Button type="button" className="h-8 p-2" variant="outline" icon={<PanelRightOpen />} onClick={() => setSheetOpen(true)}>
            View
          </Button>
        ) : (
          <>
            {canCreate && (
              <Link href={`${path}/map-control`} className="text-sm font-medium text-primary underline underline-offset-4">
                <Button type="button" className="h-8 p-2" variant="outline">
                  Create
                </Button>
              </Link>
            )}
          </>
        )}
      </div>

      {Object.entries(grouped).map(([framework, nodes], index, array) => (
        <div key={framework} className={`mb-2 flex gap-5 items-center pb-2 ${index < array.length - 1 ? 'border-b' : ''}`}>
          <StandardChip referenceFramework={framework ?? ''} />{' '}
          <div className="flex gap-2.5 flex-wrap">
            {nodes.map((node) => {
              const href = node.type === 'Subcontrol' ? `/controls/${node.controlId}/${node.id}` : `/controls/${node.id}`
              return <RelatedControlChip key={node.refCode} refCode={node.refCode} href={href} mappingType={node.mappingType} relation={node.relation} />
            })}
          </div>
        </div>
      ))}

      <MappedRelationsSheet open={sheetOpen} onOpenChange={setSheetOpen} queryData={data} />
    </Card>
  )
}

export default RelatedControls
