'use client'

import React, { useMemo, useState } from 'react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { DataTable } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { Dialog, DialogContent, DialogHeader } from '@repo/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { useGetFindingAssociations } from '@/lib/graphql-hooks/finding'
import { useGetRiskById } from '@/lib/graphql-hooks/risk'
import { useVulnerability } from '@/lib/graphql-hooks/vulnerability'
import ObjectAssociationSwitch from '@/components/shared/object-association/object-association-switch'
import { ObjectAssociationNodeEnum, type Section, type TConnectionLike } from '@/components/shared/object-association/types/object-association-types'
import { getAttentionColumns, getSeverityClass, TYPE_ICONS } from './attention-table-config'
import ViewFindingSheet from '@/components/pages/protected/findings/view-finding-sheet'
import ViewVulnerabilitySheet from '@/components/pages/protected/vulnerabilities/view-vulnerability-sheet'
import AssociationTimeline from './association-timeline'
import {
  useFindingTimeline,
  useRiskTimeline,
  useVulnerabilityTimeline,
  extractFindingTimelineNodes,
  extractRiskTimelineNodes,
  extractVulnerabilityTimelineNodes,
} from '@/lib/graphql-hooks/associations-timeline'

export type AttentionItem = {
  id: string
  name: string
  type: 'Vulnerability' | 'Finding' | 'Risk'
  severity: string
  status: string
  createdAt: string
}

const TYPE_NODE_ENUM: Record<AttentionItem['type'], ObjectAssociationNodeEnum> = {
  Vulnerability: ObjectAssociationNodeEnum.VULNERABILITY,
  Finding: ObjectAssociationNodeEnum.FINDING,
  Risk: ObjectAssociationNodeEnum.RISKS,
}

const AssociationGraphContent = ({ item }: { item: AttentionItem }) => {
  const { data: findingData } = useGetFindingAssociations(item.type === 'Finding' ? item.id : undefined)
  const { data: riskData } = useGetRiskById(item.type === 'Risk' ? item.id : null)
  useVulnerability(item.type === 'Vulnerability' ? item.id : undefined)

  const sections: Section = useMemo(() => {
    if (item.type === 'Finding' && findingData?.finding) {
      const f = findingData.finding
      const result: Section = {}
      if (f.controls?.edges?.length) result.controls = f.controls as TConnectionLike
      if (f.subcontrols?.edges?.length) result.subcontrols = f.subcontrols as TConnectionLike
      if (f.risks?.edges?.length) result.risks = f.risks as TConnectionLike
      if (f.programs?.edges?.length) result.programs = f.programs as TConnectionLike
      if (f.tasks?.edges?.length) result.tasks = f.tasks as TConnectionLike
      return result
    }
    if (item.type === 'Risk' && riskData?.risk) {
      const r = riskData.risk
      const result: Section = {}
      if (r.controls?.edges?.length) result.controls = r.controls as TConnectionLike
      if (r.subcontrols?.edges?.length) result.subcontrols = r.subcontrols as TConnectionLike
      if (r.procedures?.edges?.length) result.procedures = r.procedures as TConnectionLike
      if (r.programs?.edges?.length) result.programs = r.programs as TConnectionLike
      if (r.tasks?.edges?.length) result.tasks = r.tasks as TConnectionLike
      return result
    }
    return {}
  }, [item, findingData, riskData])

  const centerNode = {
    type: TYPE_NODE_ENUM[item.type],
    node: { id: item.id, name: item.name, displayID: item.id },
  }

  return <ObjectAssociationSwitch centerNode={centerNode} sections={sections} canEdit={false} />
}

const AssociationTimelineContent = ({ item }: { item: AttentionItem }) => {
  const { data: findingData, isLoading: findingLoading } = useFindingTimeline(item.type === 'Finding' ? item.id : undefined)
  const { data: riskData, isLoading: riskLoading } = useRiskTimeline(item.type === 'Risk' ? item.id : undefined)
  const { data: vulnData, isLoading: vulnLoading } = useVulnerabilityTimeline(item.type === 'Vulnerability' ? item.id : undefined)

  const isLoading = findingLoading || riskLoading || vulnLoading

  const nodes = useMemo(() => {
    if (item.type === 'Finding') return extractFindingTimelineNodes(findingData)
    if (item.type === 'Risk') return extractRiskTimelineNodes(riskData)
    return extractVulnerabilityTimelineNodes(vulnData)
  }, [item.type, findingData, riskData, vulnData])

  return <AssociationTimeline nodes={nodes} isLoading={isLoading} />
}

type Props = {
  items: AttentionItem[]
  isLoading?: boolean
}

const ItemsRequiringAttention = ({ items, isLoading }: Props) => {
  const router = useRouter()
  const [selectedItem, setSelectedItem] = useState<AttentionItem | null>(null)
  const [viewItem, setViewItem] = useState<AttentionItem | null>(null)

  const columns = useMemo(() => getAttentionColumns(setSelectedItem), [])

  const handleRowClick = (row: AttentionItem) => {
    if (row.type === 'Risk') {
      router.push(`/exposure/risks/${row.id}`)
    } else {
      setViewItem(row)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xl font-medium leading-7 mb-4">Items Requiring Attention</p>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} height={40} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <AlertTriangle size={32} className="mb-3 opacity-50" />
            <p className="text-sm font-medium">No critical or high severity items</p>
            <p className="text-xs">All open items are medium or low severity.</p>
          </div>
        ) : (
          <>
            <DataTable columns={columns} data={items} onRowClick={(row) => handleRowClick(row)} tableKey={TableKeyEnum.EXPOSURE_ATTENTION} />
          </>
        )}
      </CardContent>

      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                {React.createElement(TYPE_ICONS[selectedItem.type], { size: 16 })}
                <span className="font-semibold text-base leading-none">{selectedItem.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${getSeverityClass(selectedItem.severity)}`}>{selectedItem.severity || 'Unknown'}</span>
                <span className="text-xs text-muted-foreground">{selectedItem.type}</span>
              </div>
            </DialogHeader>
            <Tabs defaultValue="associations">
              <TabsList className="mb-4">
                <TabsTrigger value="associations">Associations</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>
              <TabsContent value="associations">
                <AssociationGraphContent item={selectedItem} />
              </TabsContent>
              <TabsContent value="timeline">
                <AssociationTimelineContent item={selectedItem} />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      <ViewFindingSheet entityId={viewItem?.type === 'Finding' ? viewItem.id : null} onClose={() => setViewItem(null)} />
      <ViewVulnerabilitySheet entityId={viewItem?.type === 'Vulnerability' ? viewItem.id : null} onClose={() => setViewItem(null)} />
    </Card>
  )
}

export default ItemsRequiringAttention
