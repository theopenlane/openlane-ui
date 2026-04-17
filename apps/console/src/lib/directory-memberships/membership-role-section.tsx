import React from 'react'
import { formatDate } from '@/utils/date'
import type { MembershipRoleBucket, MembershipsByRole } from './group-memberships'
import { ROLE_ORDER } from './group-memberships'

const MembershipRoleSection = ({ label, bucket }: { label: string; bucket: MembershipRoleBucket }) => {
  if (bucket.totalCount === 0) return null
  const hiddenCount = Math.max(0, bucket.totalCount - bucket.items.length)
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-foreground/80">
        {label} ({bucket.totalCount})
      </p>
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-0.5 text-xs">
        <span className="text-muted-foreground/70">Group</span>
        <span className="text-muted-foreground/70">Added</span>
        <span className="text-muted-foreground/70">Removed</span>
        {bucket.items.map((item) => (
          <React.Fragment key={item.id}>
            <span className="truncate">{item.groupName}</span>
            <span className="text-muted-foreground tabular-nums">{item.addedAt ? formatDate(item.addedAt) : '—'}</span>
            <span className="text-muted-foreground tabular-nums">{item.removedAt ? formatDate(item.removedAt) : '—'}</span>
          </React.Fragment>
        ))}
      </div>
      {hiddenCount > 0 && <p className="text-[11px] italic text-muted-foreground/70">+ {hiddenCount} more not shown</p>}
    </div>
  )
}

export const MembershipRoleSections = ({ memberships }: { memberships: MembershipsByRole }) => (
  <>
    {ROLE_ORDER.map(({ key, label }) => (
      <MembershipRoleSection key={key} label={label} bucket={memberships[key]} />
    ))}
  </>
)
