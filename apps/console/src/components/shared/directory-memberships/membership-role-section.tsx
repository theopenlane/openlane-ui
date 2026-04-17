import React from 'react'
import { cn } from '@repo/ui/lib/utils'
import { formatDate } from '@/utils/date'
import type { MembershipRoleBucket, MembershipsByRole } from '@/lib/directory-memberships/group-memberships'
import { ROLE_ORDER } from '@/lib/directory-memberships/group-memberships'

const GRID = 'grid grid-cols-[minmax(0,1fr)_140px_140px]'

const MembershipRoleSection = ({ label, bucket }: { label: string; bucket: MembershipRoleBucket }) => {
  if (bucket.totalCount === 0) return null
  const hiddenCount = Math.max(0, bucket.totalCount - bucket.items.length)
  return (
    <div>
      <div className="mb-2 flex items-baseline gap-2">
        <h4 className="text-sm font-semibold text-foreground">{label}</h4>
        <span className="text-xs text-muted-foreground">({bucket.totalCount})</span>
      </div>
      <div className="overflow-hidden rounded-md border border-border">
        <div className={cn(GRID, 'bg-muted/40 text-[11px] font-medium uppercase tracking-wide text-muted-foreground')}>
          <div className="px-3 py-2">Group</div>
          <div className="px-3 py-2">Added</div>
          <div className="px-3 py-2">Removed</div>
        </div>
        <div>
          {bucket.items.map((item) => {
            const removed = item.removedAt !== null
            return (
              <div
                key={item.id}
                className={cn(
                  GRID,
                  'group border-b transition-colors text-xs last:border-b-0 data-[state=selected]:bg-muted [&:nth-child(even)]:bg-table-secondary hover:bg-table-row-bg-hover',
                  removed && 'text-muted-foreground',
                )}
              >
                <div className={cn('px-3 py-1.5 truncate', removed && 'line-through')}>{item.groupName}</div>
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

export const MembershipRoleSections = ({ memberships }: { memberships: MembershipsByRole }) => (
  <div className="space-y-5">
    {ROLE_ORDER.map(({ key, label }) => (
      <MembershipRoleSection key={key} label={label} bucket={memberships[key]} />
    ))}
  </div>
)
