import { cn } from '@repo/ui/lib/utils'
import { Badge } from '@repo/ui/badge'
import { formatDate } from '@/utils/date'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import type { MembershipList as MembershipListData } from '@/lib/directory-memberships/group-memberships'

const GRID = 'grid grid-cols-[minmax(0,1fr)_120px_140px_140px]'

export const MembershipList = ({ memberships }: { memberships: MembershipListData }) => {
  const hiddenCount = Math.max(0, memberships.totalCount - memberships.items.length)
  return (
    <div>
      <div className="overflow-hidden rounded-md border border-border max-w-162.5">
        <div className={cn(GRID, 'bg-muted/40 text-[11px] font-medium uppercase tracking-wide text-muted-foreground')}>
          <div className="px-3 py-2">Group</div>
          <div className="px-3 py-2">Role</div>
          <div className="px-3 py-2">Added</div>
          <div className="px-3 py-2">Removed</div>
        </div>
        <div>
          {memberships.items.map((item) => {
            const removed = item.removedAt !== null
            return (
              <div
                key={item.id}
                className={cn(
                  GRID,
                  'group border-b transition-colors text-xs last:border-b-0 data-[state=selected]:bg-muted even:bg-table-secondary hover:bg-table-row-bg-hover',
                  removed && 'text-muted-foreground',
                )}
              >
                <div className={cn('px-3 py-1.5 truncate', removed && 'line-through')}>{item.groupName}</div>
                <div className="px-3 py-1.5">
                  <Badge variant="outline">{getEnumLabel(item.role)}</Badge>
                </div>
                <div className="px-3 py-1.5 tabular-nums">{item.addedAt ? formatDate(item.addedAt) : '—'}</div>
                <div className="px-3 py-1.5 tabular-nums">{item.removedAt ? formatDate(item.removedAt) : '—'}</div>
              </div>
            )
          })}
        </div>
      </div>
      {hiddenCount > 0 && <p className="mt-2 text-[11px] italic text-muted-foreground">+ {hiddenCount} more not shown</p>}
    </div>
  )
}
