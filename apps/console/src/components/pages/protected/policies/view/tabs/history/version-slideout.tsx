'use client'

import React, { useMemo, useState } from 'react'
import { Sheet, SheetContent } from '@repo/ui/sheet'
import { History } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { type InternalPolicyByIdFragment, InternalPolicyDocumentManagementMode } from '@repo/codegen/src/schema'
import { formatTimeSince } from '@/utils/date'
import VersionReadonly from './version-readonly'
import VersionDiff from './version-diff'
import FieldsSummary from './fields-summary'
import FieldsDiff from './fields-diff'
import { type HistoryNode } from './types'
import { toPlateValue } from './utils'
import { stringToPlateValue } from '@/components/shared/plate/plate-utils'
import CollapsibleSection from '@/components/shared/collapsible-section/collapsible-section'
import { SlideoutHeader } from '@/components/shared/crud-base/slideout-header'

type VersionSlideoutProps = {
  historyId: string | null
  histories: HistoryNode[]
  currentPolicy: InternalPolicyByIdFragment
  groupNameMap?: Map<string, string>
  canRestore?: boolean
  onClose: () => void
  onRestore: (id: string) => void
}

const VersionSlideout: React.FC<VersionSlideoutProps> = ({ historyId, histories, currentPolicy, groupNameMap, canRestore = true, onClose, onRestore }) => {
  const metadataOnly = currentPolicy.managementMode === InternalPolicyDocumentManagementMode.INTEGRATION
  const [selectedPane, setSelectedPane] = useState<'version' | 'diff'>('version')
  const record = useMemo(() => (historyId ? (histories.find((h) => h?.id === historyId) ?? null) : null), [historyId, histories])
  const open = !!record
  const previousValue = useMemo(() => toPlateValue(record?.detailsJSON) ?? stringToPlateValue(record?.details), [record?.detailsJSON, record?.details])
  const currentValue = useMemo(() => toPlateValue(currentPolicy.detailsJSON) ?? stringToPlateValue(currentPolicy.details), [currentPolicy.detailsJSON, currentPolicy.details])

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
    >
      <SheetContent
        header={
          record ? (
            <SlideoutHeader
              title={record.revision ?? 'Policy version'}
              aboveTitle={record.historyTime ? <p className="text-xs text-muted-foreground">{formatTimeSince(record.historyTime)}</p> : undefined}
              onClose={onClose}
              primaryAction={canRestore ? { label: 'Restore this version', icon: <History size={16} />, onClick: () => onRestore(record.id) } : undefined}
            />
          ) : undefined
        }
      >
        {record ? (
          <Tabs value={selectedPane} onValueChange={(v) => setSelectedPane(v as 'version' | 'diff')}>
            <TabsList>
              <TabsTrigger value="version">Version</TabsTrigger>
              <TabsTrigger value="diff">Diff</TabsTrigger>
            </TabsList>
            <TabsContent value="version">
              <div className="flex flex-col gap-4">
                <CollapsibleSection label="Metadata" defaultOpen={metadataOnly}>
                  <FieldsSummary history={record} groupNameMap={groupNameMap} />
                </CollapsibleSection>
                {!metadataOnly && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Details</h4>
                    <VersionReadonly value={previousValue} detailsHtml={record.details ?? null} cacheKey={record.id} />
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="diff">
              <div className="flex flex-col gap-4">
                <CollapsibleSection label="Field changes" defaultOpen>
                  <FieldsDiff history={record} current={currentPolicy} groupNameMap={groupNameMap} />
                </CollapsibleSection>
                {!metadataOnly && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Details diff</h4>
                    <VersionDiff previous={previousValue} current={currentValue} />
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

export default VersionSlideout
