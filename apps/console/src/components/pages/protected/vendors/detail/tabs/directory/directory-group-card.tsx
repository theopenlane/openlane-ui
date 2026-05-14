'use client'

import React, { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@radix-ui/react-collapsible'
import { Badge } from '@repo/ui/badge'
import { cn } from '@repo/ui/lib/utils'
import type { VendorDirectoryGroup, VendorDirectoryMember } from '@/lib/graphql-hooks/vendor-directory'
import DirectoryMembersTable from './directory-members-table'

type DirectoryGroupCardProps = {
  group: VendorDirectoryGroup
  showIntegrationBadge: boolean
}

export const computeMembers = (group: VendorDirectoryGroup): VendorDirectoryMember[] => (group.members.edges ?? []).flatMap((edge) => (edge?.node ? [edge.node] : []))

export const matchedCount = (members: VendorDirectoryMember[]): number => members.filter((m) => m.directoryAccount.identityHolderID).length

const getCoverageColor = (total: number, matched: number): string => {
  if (total === 0) return 'text-muted-foreground'
  if (matched === 0) return 'text-destructive'
  if (matched === total) return 'text-success'
  return 'text-yellow-500'
}

const DirectoryGroupCard: React.FC<DirectoryGroupCardProps> = ({ group, showIntegrationBadge }) => {
  const [open, setOpen] = useState(false)
  const members = useMemo(() => computeMembers(group), [group])
  const total = group.members.totalCount
  const matched = useMemo(() => matchedCount(members), [members])
  const coverageColor = getCoverageColor(total, matched)

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-md border border-border bg-card">
      <CollapsibleTrigger className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <ChevronDown size={16} className={cn('transition-transform text-muted-foreground', open ? '' : '-rotate-90')} />
        <span className="font-medium truncate">{group.displayName || group.email || group.id}</span>
        {showIntegrationBadge && group.integration?.name && (
          <Badge variant="outline" className="ml-1">
            {group.integration.name}
          </Badge>
        )}
        <div className="ml-auto flex items-center gap-4 text-sm tabular-nums">
          <span className={cn('font-medium', coverageColor)}>
            {matched} / {total} matched
          </span>
          <span className="text-muted-foreground">{total} members</span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {open && (
          <div className="border-t border-border p-3">
            <DirectoryMembersTable members={members} />
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}

export default DirectoryGroupCard
