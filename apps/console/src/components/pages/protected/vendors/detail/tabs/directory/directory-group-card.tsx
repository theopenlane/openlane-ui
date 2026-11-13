'use client'

import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@radix-ui/react-collapsible'
import { Badge } from '@repo/ui/badge'
import { cn } from '@repo/ui/lib/utils'
import { pluralizeWithCount } from '@/utils/strings'
import type { VendorDirectoryGroup } from '@/lib/graphql-hooks/vendor-directory'
import DirectoryGroupMembers from './directory-group-members'

type DirectoryGroupCardProps = {
  group: VendorDirectoryGroup
  showIntegrationBadge: boolean
  isTarget?: boolean
}

const getCoverageColor = (total: number, matched: number): string => {
  if (total === 0) return 'text-muted-foreground'
  if (matched === 0) return 'text-destructive'
  if (matched === total) return 'text-success'
  return 'text-warning'
}

const DirectoryGroupCard: React.FC<DirectoryGroupCardProps> = ({ group, showIntegrationBadge, isTarget = false }) => {
  const [open, setOpen] = useState(isTarget)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isTarget) rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [isTarget])

  const total = group.members.totalCount
  const matched = group.matchedAccounts.totalCount

  return (
    <Collapsible ref={rootRef} open={open} onOpenChange={setOpen} className={cn('rounded-md border bg-card', isTarget ? 'border-primary' : 'border-border')}>
      <CollapsibleTrigger className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <ChevronDown size={16} className={cn('transition-transform text-muted-foreground', open ? '' : '-rotate-90')} />
        <span className="font-medium truncate">{group.displayName || group.email || group.id}</span>
        {showIntegrationBadge && group.integration?.name && (
          <Badge variant="outline" className="ml-1">
            {group.integration.name}
          </Badge>
        )}
        <div className="ml-auto flex items-center gap-4 text-sm tabular-nums">
          <span className={cn('font-medium', getCoverageColor(total, matched))}>
            {matched} / {total} matched
          </span>
          <span className="text-muted-foreground">{pluralizeWithCount(total, 'member')}</span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t border-border p-3">
          <DirectoryGroupMembers groupID={group.id} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export default DirectoryGroupCard
