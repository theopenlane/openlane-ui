'use client'

import React from 'react'
import { Badge } from '@repo/ui/badge'
import { cn } from '@repo/ui/lib/utils'
import { TruncatedCell } from '@repo/ui/data-table'
import ObjectSheetLink from '@/components/shared/object-sheet-link/object-sheet-link'
import { ControlChipList } from '@/components/shared/crud-base/columns/related-controls-cell'
import StandardChip from '@/components/pages/protected/standards/shared/standard-chip'
import { useOpenObjectSheet } from '@/providers/sheet-navigation-provider'
import { UserCell } from '@/components/shared/crud-base/columns/user-cell'
import { PastDuePill } from '@/components/shared/past-due-badge/past-due-badge'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { ObjectAssociationMap } from '@/components/shared/enum-mapper/object-association-enum'
import { workObjectTypeLabel, type TWorkItem, type TWorkObjectType, type TWorkOwner, type TWorkRelation } from './work-item'
import { WORK_STATUS_DOT_CLASS, type WorkStatus } from './work-status'

export const OverdueBadge = () => <PastDuePill label="Overdue" />

const WorkTypeIcon = ({ objectType, size }: { objectType: TWorkObjectType; size: number }) => {
  const { icon: Icon, color } = ObjectAssociationMap[objectType]

  return <Icon size={size} className="shrink-0" style={{ color: `var(${color})` }} />
}

export const WorkTypeCell = ({ objectType }: { objectType: TWorkObjectType }) => (
  <span className="flex items-center gap-2">
    <WorkTypeIcon objectType={objectType} size={16} />
    <span>{workObjectTypeLabel(objectType)}</span>
  </span>
)

export const WorkTypeChip = ({ objectType }: { objectType: TWorkObjectType }) => (
  <Badge variant="secondary" className="gap-1.5 font-normal">
    <WorkTypeIcon objectType={objectType} size={12} />
    <span>{workObjectTypeLabel(objectType)}</span>
  </Badge>
)

export const WorkItemLink = ({ item }: { item: TWorkItem }) => {
  const openObjectSheet = useOpenObjectSheet()

  return <ObjectSheetLink id={item.id} kind={item.objectType} label={item.item} onOpenSheet={openObjectSheet} />
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
      {item.attention && <span>{item.attention}</span>}
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
  const openObjectSheet = useOpenObjectSheet()

  if (!relatedTo) return <span className="text-muted-foreground">—</span>

  if (relatedTo.kind === 'standard') return <StandardChip referenceFramework={relatedTo.referenceFramework ?? ''} />

  if (relatedTo.kind === 'control') return <ControlChipList items={[relatedTo.control]} />

  return (
    <TruncatedCell portal>
      <ObjectSheetLink id={relatedTo.id} kind={relatedTo.objectType} label={relatedTo.label} onOpenSheet={openObjectSheet} />
    </TruncatedCell>
  )
}
