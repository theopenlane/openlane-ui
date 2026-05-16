'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@radix-ui/react-collapsible'
import { Badge } from '@repo/ui/badge'
import { cn } from '@repo/ui/lib/utils'
import type { VendorDirectoryGroup, VendorDirectoryMember } from '@/lib/graphql-hooks/vendor-directory'
import DirectoryMembersTable from './directory-members-table'

type DirectoryGroupCardProps = {
  group: VendorDirectoryGroup
  showIntegrationBadge: boolean
  targetGroupId?: string | null
}

const computeMembers = (group: VendorDirectoryGroup): VendorDirectoryMember[] => (group.members.edges ?? []).flatMap((edge) => (edge?.node ? [edge.node] : []))

const getCoverageColor = (denominator: number, matched: number): string => {
  if (denominator === 0) return 'text-muted-foreground'
  if (matched === 0) return 'text-destructive'
  if (matched === denominator) return 'text-success'
  return 'text-warning'
}

const DirectoryGroupCard: React.FC<DirectoryGroupCardProps> = ({ group, showIntegrationBadge, targetGroupId }) => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const hasScrolledToTargetRef = useRef(false)
  const isTarget = targetGroupId === group.id

  useEffect(() => {
    if (!isTarget || hasScrolledToTargetRef.current) return
    hasScrolledToTargetRef.current = true
    setOpen(true)
    rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [isTarget])

  const members = useMemo(() => computeMembers(group), [group])
  const total = group.members.totalCount
  const loaded = members.length
  const matched = useMemo(() => members.filter((m) => m.directoryAccount.identityHolderID).length, [members])
  const truncated = loaded < total
  const coverageColor = getCoverageColor(loaded, matched)

  return (
    <Collapsible ref={rootRef} open={open} onOpenChange={setOpen} className="rounded-md border border-border bg-card">
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
            {matched} / {loaded} matched{truncated ? ` (of ${total})` : ''}
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
