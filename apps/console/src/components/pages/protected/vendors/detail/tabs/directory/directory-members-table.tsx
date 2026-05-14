import React from 'react'
import Link from 'next/link'
import { Badge } from '@repo/ui/badge'
import { cn } from '@repo/ui/lib/utils'
import { formatDate } from '@/utils/date'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import type { VendorDirectoryMember } from '@/lib/graphql-hooks/vendor-directory'

const GRID = 'grid grid-cols-[minmax(0,1.5fr)_minmax(0,1.5fr)_120px_140px]'

type DirectoryMembersTableProps = {
  members: VendorDirectoryMember[]
}

const directoryIdentityLabel = (account: VendorDirectoryMember['directoryAccount']) => {
  if (account.canonicalEmail) return account.canonicalEmail
  if (account.displayName) return account.displayName
  const name = [account.givenName, account.familyName].filter(Boolean).join(' ')
  return name || account.id
}

const DirectoryMembersTable: React.FC<DirectoryMembersTableProps> = ({ members }) => {
  if (members.length === 0) {
    return <div className="px-4 py-3 text-sm italic text-muted-foreground">No members in this group.</div>
  }

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div className={cn(GRID, 'bg-muted/40 text-[11px] font-medium uppercase tracking-wide text-muted-foreground')}>
        <div className="px-3 py-2">Directory Identity</div>
        <div className="px-3 py-2">Personnel Record</div>
        <div className="px-3 py-2">Role</div>
        <div className="px-3 py-2">Added</div>
      </div>
      <div>
        {members.map((member) => {
          const account = member.directoryAccount
          const personnel = account.identityHolder
          const removed = member.removedAt !== null
          return (
            <div
              key={member.id}
              className={cn(
                GRID,
                'border-b transition-colors text-xs last:border-b-0 even:bg-table-secondary hover:bg-table-row-bg-hover',
                !personnel && 'text-muted-foreground',
                removed && 'line-through',
              )}
            >
              <div className="px-3 py-2 truncate">{directoryIdentityLabel(account)}</div>
              <div className="px-3 py-2 truncate">
                {personnel ? (
                  <Link href={`/registry/personnel/${personnel.id}`} className="text-blue-500 hover:underline">
                    {personnel.fullName || personnel.email}
                  </Link>
                ) : (
                  <span className="italic">No personnel record</span>
                )}
              </div>
              <div className="px-3 py-2">{member.role ? <Badge variant="outline">{getEnumLabel(member.role)}</Badge> : <span>—</span>}</div>
              <div className="px-3 py-2 tabular-nums">{member.addedAt ? formatDate(member.addedAt) : '—'}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default DirectoryMembersTable
