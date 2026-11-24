import { Fragment } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import { cn } from '@repo/ui/lib/utils'
import StandardChip from '@/components/pages/protected/standards/shared/standard-chip'
import { ControlIconMapper16 } from '@/components/shared/enum-mapper/control-enum'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { type TFrameworkGroup } from './linked-control-groups'
import { LinkedControlRef } from './linked-control-ref'
import { OtherImplementations } from './other-implementations'

type TLinkedControlsListProps = {
  groups: TFrameworkGroup[]
  showOthers: boolean
}

export const LinkedControlsList = ({ groups, showOthers }: TLinkedControlsListProps) => (
  <div className="overflow-hidden rounded-lg border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Control</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Status</TableHead>
          {showOthers && <TableHead>Other Implementations</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {groups.map(({ framework, rows }) => (
          <Fragment key={framework}>
            <TableRow className="bg-card">
              <TableCell colSpan={showOthers ? 4 : 3}>
                <StandardChip referenceFramework={framework} size="lg" />
              </TableCell>
            </TableRow>
            {rows.map((row) => (
              <TableRow key={row.id} className={cn(!row.href && 'text-muted-foreground')}>
                <TableCell className={cn(row.isSubcontrol && 'pl-10')}>
                  <LinkedControlRef row={row} />
                </TableCell>
                <TableCell>{row.title || '-'}</TableCell>
                <TableCell>
                  {row.status && (
                    <span className="inline-flex items-center gap-2 whitespace-nowrap">
                      {ControlIconMapper16[row.status]}
                      {getEnumLabel(row.status)}
                    </span>
                  )}
                </TableCell>
                {showOthers && (
                  <TableCell className="max-w-64">
                    <OtherImplementations others={row.others} />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </Fragment>
        ))}
      </TableBody>
    </Table>
  </div>
)
