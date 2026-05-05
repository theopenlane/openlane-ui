'use client'

import React, { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { type InternalPolicyByIdFragment } from '@repo/codegen/src/schema'
import { formatTimeSince } from '@/utils/date'
import VersionReadonly from './version-readonly'
import VersionDiff from './version-diff'
import FieldsSummary from './fields-summary'
import FieldsDiff from './fields-diff'
import { type HistoryNode } from './types'
import { toPlateValue } from './utils'
import { stringToPlateValue } from '@/components/shared/plate/plate-utils'

type CollapsibleSectionProps = {
  label: string
  children: React.ReactNode
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ label, children }) => {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-1 text-sm font-medium" aria-expanded={open}>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? '' : '-rotate-90'}`} />
        {label}
      </button>
      {open ? <div className="mt-2">{children}</div> : null}
    </div>
  )
}

type VersionSlideoutProps = {
  historyId: string | null
  histories: HistoryNode[]
  currentPolicy: InternalPolicyByIdFragment
  onClose: () => void
  onRestore: (id: string) => void
}

const VersionSlideout: React.FC<VersionSlideoutProps> = ({ historyId, histories, currentPolicy, onClose, onRestore }) => {
  const [activePane, setActivePane] = useState<'version' | 'diff'>('version')
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
      <SheetContent>
        {record ? (
          <div className="flex flex-col h-full">
            <SheetHeader>
              <SheetTitle>{record.revision ?? 'Policy version'}</SheetTitle>
              <p className="text-xs text-muted-foreground">{record.historyTime ? formatTimeSince(record.historyTime) : null}</p>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              <Tabs value={activePane} onValueChange={(v) => setActivePane(v as 'version' | 'diff')}>
                <TabsList>
                  <TabsTrigger value="version">Version</TabsTrigger>
                  <TabsTrigger value="diff">Diff</TabsTrigger>
                </TabsList>
                <TabsContent value="version">
                  <div className="flex flex-col gap-4">
                    <CollapsibleSection label="Metadata">
                      <FieldsSummary history={record} />
                    </CollapsibleSection>
                    <div>
                      <h4 className="mb-2 text-sm font-medium">Details</h4>
                      <VersionReadonly value={previousValue} detailsHtml={record.details ?? null} cacheKey={record.id} />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="diff">
                  <div className="flex flex-col gap-4">
                    <CollapsibleSection label="Field changes">
                      <FieldsDiff history={record} current={currentPolicy} />
                    </CollapsibleSection>
                    <div>
                      <h4 className="mb-2 text-sm font-medium">Details diff</h4>
                      <VersionDiff previous={previousValue} current={currentValue} />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="flex justify-end gap-2 border-t border-border p-3">
              <Button type="button" onClick={() => onRestore(record.id)}>
                Restore this version
              </Button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

export default VersionSlideout
