import { useId, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import { cn } from '@repo/ui/lib/utils'
import { StandardsHexagon } from '@/components/shared/standards-color-mapper/standards-color-mapper'
import { CUSTOM_STANDARD_FILTER_VALUE } from '@/components/shared/table-filter/custom-standard-filter'
import { pluralizeWithCount } from '@/utils/strings'
import { type TFrameworkGroup } from './linked-control-groups'
import { LinkedControlRef } from './linked-control-ref'
import { LinkedControlStatus } from './linked-control-status'
import { OtherImplementations } from './other-implementations'

const HEAD_CLASS = 'h-10 whitespace-nowrap text-xs font-medium uppercase'
const CELL_CLASS = 'px-4 py-2.5'

type TLinkedControlsGroupProps = {
  group: TFrameworkGroup
  showOthers: boolean
}

const LinkedControlsGroup = ({ group: { framework, rows }, showOthers }: TLinkedControlsGroupProps) => {
  const bodyId = useId()
  const [isExpanded, setIsExpanded] = useState(true)
  const linkedCount = rows.filter(({ href }) => href).length
  const Chevron = isExpanded ? ChevronDown : ChevronRight

  return (
    <>
      <TableBody className="border-b">
        <TableRow className="bg-card">
          <TableCell colSpan={showOthers ? 4 : 3} className={CELL_CLASS}>
            <Button
              type="button"
              variant="transparent"
              aria-expanded={isExpanded}
              aria-controls={bodyId}
              className="h-auto gap-2 p-0 text-sm font-normal"
              onClick={() => setIsExpanded((expanded) => !expanded)}
            >
              <Chevron size={16} className="text-muted-foreground" aria-hidden />
              <StandardsHexagon shortName={framework} />
              <span className="font-semibold">{framework || CUSTOM_STANDARD_FILTER_VALUE}</span>
              <span className="text-muted-foreground">{pluralizeWithCount(linkedCount, 'control')}</span>
            </Button>
          </TableCell>
        </TableRow>
      </TableBody>
      <TableBody id={bodyId} hidden={!isExpanded} className="border-b last:border-b-0">
        {rows.map((row) => (
          <TableRow key={row.id} className={cn(!row.href && 'text-muted-foreground')}>
            <TableCell className={cn(CELL_CLASS, row.isSubcontrol && 'pl-10')}>
              <LinkedControlRef row={row} />
            </TableCell>
            <TableCell className={CELL_CLASS}>{row.title || '-'}</TableCell>
            <TableCell className={CELL_CLASS}>
              <LinkedControlStatus status={row.status} />
            </TableCell>
            {showOthers && <TableCell className={cn(CELL_CLASS, 'max-w-64')}>{row.others.items.length > 0 ? <OtherImplementations others={row.others} /> : '-'}</TableCell>}
          </TableRow>
        ))}
      </TableBody>
    </>
  )
}

type TLinkedControlsListProps = {
  groups: TFrameworkGroup[]
  showOthers: boolean
}

export const LinkedControlsList = ({ groups, showOthers }: TLinkedControlsListProps) => (
  <div className="overflow-hidden rounded-lg border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className={HEAD_CLASS}>Control</TableHead>
          <TableHead className={HEAD_CLASS}>Title</TableHead>
          <TableHead className={HEAD_CLASS}>Status</TableHead>
          {showOthers && <TableHead className={HEAD_CLASS}>Other Implementations</TableHead>}
        </TableRow>
      </TableHeader>
      {groups.map((group) => (
        <LinkedControlsGroup key={group.framework} group={group} showOthers={showOthers} />
      ))}
    </Table>
  </div>
)
