import React, { useState } from 'react'
import { useParams, usePathname } from 'next/navigation'
import { useGetMappedControls } from '@/lib/graphql-hooks/mapped-control'
import { Button } from '@repo/ui/button'
import { PanelRightOpen } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'
import { MappedControlMappingSource, MappedControlMappingType } from '@repo/codegen/src/schema'
import MappedRelationsSheet from './mapped-relationships-sheet'
import { RelatedControlChip } from './shared/related-control-chip'
import Link from 'next/link'
import StandardChip from '../standards/shared/standard-chip'
import { useGetControlsByRefCode } from '@/lib/graphql-hooks/controls'
import { useGetSubcontrolsByRefCode } from '@/lib/graphql-hooks/subcontrol'

export type RelatedNode = {
  type: 'Control' | 'Subcontrol'
  id: string
  refCode: string
  referenceFramework?: string | null
  controlId?: string
  mappingType: MappedControlMappingType
  relation?: string | null
  source: MappedControlMappingSource
}

export type GroupedControls = Record<string, RelatedNode[]>

type Props = {
  canCreate: boolean
  refCode: string
  sourceFramework: string | null | undefined
  title?: string
  filterFramework?: 'all' | 'custom' | 'non-custom'
  includeSubcontrols?: boolean
  showActions?: boolean
}

const RelatedControls = ({ canCreate, refCode, sourceFramework, title = 'Related Controls', filterFramework = 'all', includeSubcontrols = true, showActions = true }: Props) => {
  const { id, subcontrolId } = useParams<{ id: string; subcontrolId: string }>()
  const [sheetOpen, setSheetOpen] = useState(false)
  const path = usePathname()

  // fetch suggested mapped controls, which are the ones created by the system based on control references
  // we cannot use the control ID because this is unique to the control and not the refCode for the control within the organization
  const withFilter = { refCode: refCode, referenceFramework: sourceFramework }
  const suggestedControlWhere = {
    and: [
      { source: MappedControlMappingSource.SUGGESTED },
      subcontrolId
        ? {
            or: [{ hasFromSubcontrolsWith: [withFilter] }, { hasToSubcontrolsWith: [withFilter] }],
          }
        : {
            or: [{ hasFromControlsWith: [withFilter] }, { hasToControlsWith: [withFilter] }],
          },
    ],
  }
  const where = subcontrolId
    ? {
        or: [
          suggestedControlWhere,
          {
            or: [{ hasFromSubcontrolsWith: [{ id: subcontrolId }] }, { hasToSubcontrolsWith: [{ id: subcontrolId }] }],
          },
        ],
      }
    : id
    ? {
        or: [
          suggestedControlWhere,
          {
            or: [{ hasFromControlsWith: [{ id }] }, { hasToControlsWith: [{ id }] }],
          },
        ],
      }
    : undefined

  const { data } = useGetMappedControls({ where, enabled: !!where })

  const grouped: GroupedControls = {}

  data?.mappedControls?.edges?.forEach((edge) => {
    const node = edge?.node
    if (!node) return

    const isFromControl = node?.fromControls?.edges?.some((e) => e?.node?.refCode === refCode)
    const isFromSub = node?.fromSubcontrols?.edges?.some((e) => e?.node?.refCode === refCode)
    const isToControl = node?.toControls?.edges?.some((e) => e?.node?.refCode === refCode)
    const isToSub = node?.toSubcontrols?.edges?.some((e) => e?.node?.refCode === refCode)

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
                  source: node.source,
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
                  source: node.source,
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
                  source: node.source,
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
                  source: node.source,
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

  const filteredGrouped = Object.fromEntries(
    Object.entries(grouped)
      .filter(([framework]) => {
        if (filterFramework === 'custom') return framework === 'CUSTOM'
        if (filterFramework === 'non-custom') return framework !== 'CUSTOM'
        return true
      })
      .map(([framework, nodes]) => {
        const filteredNodes = includeSubcontrols ? nodes : nodes.filter((node) => node.type === 'Control')
        return [framework, filteredNodes]
      })
      .filter(([, nodes]) => nodes.length > 0),
  )

  const allControlRefCodes = Object.values(filteredGrouped)
    .flatMap((nodes) => nodes.filter((n) => n.type === 'Control').map((n) => n.refCode))
    .filter(Boolean)

  const allSubcontrolRefCodes = Object.values(filteredGrouped)
    .flatMap((nodes) => nodes.filter((n) => n.type === 'Subcontrol').map((n) => n.refCode))
    .filter(Boolean)

  const { data: refcodeData } = useGetControlsByRefCode({ refCodeIn: allControlRefCodes })
  const { data: subcontrolRefcodeData } = useGetSubcontrolsByRefCode({ refCodeIn: allSubcontrolRefCodes })

  const generateControlHref = (node: RelatedNode) => {
    const controls = refcodeData?.controls?.edges?.filter((control) => control?.node?.refCode === node.refCode) || []
    const orgOwnedControl = controls?.find((control) => !control?.node?.systemOwned)?.node
    if (orgOwnedControl) {
      return `/controls/${orgOwnedControl.id}`
    }

    const systemOwnedControl = controls?.find((control) => control?.node?.systemOwned)?.node

    if (systemOwnedControl) {
      return `/standards/${systemOwnedControl?.standardID}?controlId=${systemOwnedControl?.id}`
    }
    return ''
  }

  const generateSubcontrolHref = (node: RelatedNode) => {
    const controls = subcontrolRefcodeData?.subcontrols?.edges?.filter((control) => control?.node?.refCode === node.refCode) || []
    const orgOwnedControl = controls?.find((control) => !control?.node?.systemOwned)?.node
    if (orgOwnedControl) {
      return `/controls/${orgOwnedControl.controlID}/${orgOwnedControl.id}`
    }
    const systemOwnedControl = controls?.find((control) => control?.node?.systemOwned)?.node

    if (systemOwnedControl) {
      return `/standards/${systemOwnedControl.control.standardID}?controlId=${systemOwnedControl.id}`
    }
    return ''
  }

  const hasFilteredData = Object.values(filteredGrouped).some((nodes) => nodes.some((node) => node.source !== MappedControlMappingSource.SUGGESTED))
  const hasGroupedControls = Object.keys(filteredGrouped).length > 0

  if (!data) {
    return null
  }
  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-5">
        <p className="text-lg">{title}</p>
        {showActions &&
          (hasFilteredData ? (
            <Button type="button" className="h-8 p-2" variant="secondary" icon={<PanelRightOpen />} onClick={() => setSheetOpen(true)}>
              View
            </Button>
          ) : (
            <>
              {canCreate && (
                <Link href={`${path}/map-control`} className="text-sm font-medium text-primary underline underline-offset-4">
                  <Button type="button" className="h-8 p-2" variant="secondary">
                    Create
                  </Button>
                </Link>
              )}
            </>
          ))}
      </div>

      {hasGroupedControls ? (
        Object.entries(filteredGrouped).map(([framework, nodes], index, array) => (
          <div key={framework} className={`mb-2 flex gap-5 items-center pb-2 ${index < array.length - 1 ? 'border-b' : ''}`}>
            <StandardChip referenceFramework={framework ?? ''} />{' '}
            <div className="flex gap-2.5 flex-wrap">
              {nodes.map((node) => {
                const href = node.type === 'Subcontrol' ? generateSubcontrolHref(node) : generateControlHref(node)
                return <RelatedControlChip key={node.refCode} refCode={node.refCode} href={href} mappingType={node.mappingType} relation={node.relation} source={node.source} />
              })}
            </div>
          </div>
        ))
      ) : (
        <div className="text-sm italic text-muted-foreground">No related controls found.</div>
      )}

      {showActions && hasFilteredData && <MappedRelationsSheet open={sheetOpen} onOpenChange={setSheetOpen} queryData={data} />}
    </Card>
  )
}

export default RelatedControls
