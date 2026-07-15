'use client'

import React, { useMemo } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@radix-ui/react-collapsible'
import { Panel } from '@repo/ui/panel'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { ChevronDown, Download, Eye, FileText } from 'lucide-react'
import { type EvidenceWhereInput } from '@repo/codegen/src/schema'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { ExportEvidenceDialog } from '@/components/pages/protected/evidence/dialog/export-evidence-dialog'
import { type ControlEvidenceItem } from '@/lib/graphql-hooks/control'
import { fileDownload } from '@/components/shared/lib/export'
import { useNotification } from '@/hooks/useNotification'

type UploadedEvidenceSectionProps = {
  items: ControlEvidenceItem[]
  controlId: string
  programId?: string
  onView: (evidenceId: string) => void
}

const getEvidenceFiles = (item: ControlEvidenceItem) => (item.files.edges ?? []).flatMap((edge) => (edge?.node ? [edge.node] : []))

export const UploadedEvidenceSection: React.FC<UploadedEvidenceSectionProps> = ({ items, controlId, programId, onView }) => {
  const { errorNotification } = useNotification()

  const downloadFilters = useMemo(
    () => JSON.stringify({ hasControlsWith: [{ id: controlId }], ...(programId ? { hasProgramsWith: [{ id: programId }] } : {}) } satisfies EvidenceWhereInput),
    [controlId, programId],
  )

  if (items.length === 0) {
    return null
  }

  const handleDownload = async (item: ControlEvidenceItem) => {
    for (const file of getEvidenceFiles(item)) {
      if (file.presignedURL) {
        await fileDownload(file.presignedURL, file.providedFileName, errorNotification)
      }
    }
  }

  return (
    <Collapsible defaultOpen>
      <Panel className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <CollapsibleTrigger className="group flex items-center gap-2">
            <ChevronDown size={16} className="transition-transform -rotate-90 group-data-[state=open]:rotate-0" />
            <span className="text-lg font-medium">Uploaded Evidence</span>
            <Badge variant="select">
              {items.length} {items.length === 1 ? 'file' : 'files'}
            </Badge>
          </CollapsibleTrigger>
          <ExportEvidenceDialog
            filters={downloadFilters}
            trigger={
              <Button type="button" variant="secondary" className="h-8 px-2!" icon={<Download size={14} />} iconPosition="left">
                Download all
              </Button>
            }
          />
        </div>

        <CollapsibleContent className="flex flex-col gap-2">
          {items.map((item) => {
            const fileCount = getEvidenceFiles(item).length
            return (
              <div key={item.id} className="flex items-start justify-between gap-3 rounded-md border border-border p-3">
                <div className="flex items-start gap-3 min-w-0">
                  <FileText size={18} className="text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium truncate">{item.name ?? 'Untitled evidence'}</span>
                    {item.creationDate ? (
                      <span className="text-xs text-muted-foreground">
                        Uploaded <DateCell value={item.creationDate} />
                      </span>
                    ) : null}
                    {item.description ? <span className="text-xs text-muted-foreground line-clamp-2">{item.description}</span> : null}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button type="button" variant="outline" className="h-8 w-8 p-0!" aria-label="Download evidence" disabled={fileCount === 0} onClick={() => handleDownload(item)}>
                    <Download size={14} />
                  </Button>
                  <Button type="button" variant="outline" className="h-8 w-8 p-0!" aria-label="Open evidence" onClick={() => onView(item.id)}>
                    <Eye size={14} />
                  </Button>
                </div>
              </div>
            )
          })}
        </CollapsibleContent>
      </Panel>
    </Collapsible>
  )
}
