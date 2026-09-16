'use client'

import React from 'react'
import Link from 'next/link'
import { Badge } from '@repo/ui/badge'
import { cn } from '@repo/ui/lib/utils'
import { TruncatedCell } from '@repo/ui/data-table'
import { UserCell } from '@/components/shared/crud-base/columns/user-cell'
import { PastDuePill } from '@/components/shared/past-due-badge/past-due-badge'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { WORK_OBJECT_TYPE_ICON, WORK_OBJECT_TYPE_ICON_CLASS, type TWorkItem, type TWorkOwner, type TWorkRelation, type WorkObjectType } from './work-item'
import { WORK_STATUS_DOT_CLASS, type WorkStatus } from './work-status'

export const OverdueBadge = () => <PastDuePill label="Overdue" />

export const WorkTypeChip = ({ objectType }: { objectType: WorkObjectType }) => {
  const Icon = WORK_OBJECT_TYPE_ICON[objectType]

  return (
    <Badge variant="secondary" className="gap-1.5 font-normal">
      <Icon size={12} className={cn('shrink-0', WORK_OBJECT_TYPE_ICON_CLASS[objectType])} />
      <span>{getEnumLabel(objectType)}</span>
    </Badge>
  )
}

export const WorkStatusCell = ({ workStatus }: { workStatus: WorkStatus }) => (
  <span className="flex items-center gap-2">
    <span className={cn('h-2 w-2 shrink-0 rounded-full', WORK_STATUS_DOT_CLASS[workStatus])} />
    <span>{getEnumLabel(workStatus)}</span>
  </span>
)

export const WorkAttentionCell = ({ item }: { item: TWorkItem }) => {
  if (!item.attention && !item.isOverdue) return <span className="text-muted-foreground">—</span>

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {item.attention && <span className="text-sm">{item.attention}</span>}
      {item.isOverdue && <OverdueBadge />}
    </div>
  )
}

export const WorkOwnerCell = ({ owners }: { owners: TWorkOwner[] }) =>
  owners.length > 1 ? (
    <div className="flex min-w-0 items-center gap-2">
      <UserCell user={owners[0]} fallback="Unassigned" />
      <span className="shrink-0 text-xs text-muted-foreground">+{owners.length - 1}</span>
    </div>
  ) : (
    <UserCell user={owners[0]} fallback="Unassigned" />
  )

export const WorkRelationCell = ({ relatedTo }: { relatedTo: TWorkRelation | null }) => {
  if (!relatedTo) return <span className="text-muted-foreground">—</span>

  if (!relatedTo.href) return <TruncatedCell portal>{relatedTo.label}</TruncatedCell>

  return (
    <TruncatedCell portal>
      <Link href={relatedTo.href} target="_blank" rel="noopener noreferrer" prefetch={false} className="text-link hover:underline">
        {relatedTo.label}
      </Link>
    </TruncatedCell>
  )
}
