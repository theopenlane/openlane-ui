import React from 'react'
import { Badge } from '@repo/ui/badge'
import { Table, TableBody, TableCell, TableRow } from '@repo/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { EvidenceBadgeMapper } from '@/components/shared/enum-mapper/evidence-enum'
import { type AuditorDashboardEvidenceItem } from '@/lib/graphql-hooks/control'
import { getControlEvidenceStatus } from '../utils/control-status'

type EvidenceStatusCellProps = {
  items: AuditorDashboardEvidenceItem[]
}

export const EvidenceStatusCell: React.FC<EvidenceStatusCellProps> = ({ items }) => {
  const count = items.length
  const status = getControlEvidenceStatus(items.map((item) => item.status))

  return (
    <div className="flex items-center gap-2">
      {status ? EvidenceBadgeMapper[status] : <Badge variant="destructive">Missing</Badge>}
      {count > 0 && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="rounded-full border border-border text-xs flex items-center justify-center h-5 min-w-5 px-1 cursor-default">{count}</span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-sm p-0">
              <div className="flex flex-col gap-2 p-3">
                <span className="text-sm font-medium text-muted-foreground">Evidence ({count})</span>
                <div className="rounded-md border border-border overflow-hidden">
                  <Table compact>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id} className="[&:nth-child(even)]:bg-transparent">
                          <TableCell className="text-sm group-hover:bg-transparent">{item.name}</TableCell>
                          <TableCell className="text-right group-hover:bg-transparent">{item.status ? EvidenceBadgeMapper[item.status] : null}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
