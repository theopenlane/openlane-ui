'use client'

import React from 'react'
import { Badge } from '@repo/ui/badge'
import { cn } from '@repo/ui/lib/utils'
import { type SlaDefinitionsNodeNonNull } from '@/lib/graphql-hooks/sla-definition'
import { CustomEnumChipCell } from '@/components/shared/crud-base/columns/custom-enum-chip-cell'
import ObjectSheetLink from '@/components/shared/object-sheet-link/object-sheet-link'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { useOpenObjectSheet } from '@/providers/sheet-navigation-provider'
import { pluralizeWithCount } from '@/utils/strings'
import { getVulnerabilityDueDate } from '@/utils/vulnerability-due-date'
import { formatDate } from '@/utils/date'
import { exposureAssetLabel } from '../../../../exposure/detail/exposure-asset-label'
import { exposureStatusLabel, type TExposureRow } from './exposure-model'

export const ExposureDueCell: React.FC<{ row: TExposureRow; slaDefinitions: SlaDefinitionsNodeNonNull[] }> = ({ row, slaDefinitions }) => {
  if (!row.isOpen) return <span className="text-muted-foreground">—</span>
  const { dueDate, pastDue } = getVulnerabilityDueDate(row.report, slaDefinitions)
  if (!dueDate) return <span className="text-muted-foreground">—</span>
  return <span className={cn('whitespace-nowrap', pastDue && 'text-destructive')}>{formatDate(dueDate.toISOString())}</span>
}

export const ExposureStatusCell: React.FC<{ row: TExposureRow }> = ({ row }) =>
  row.report.vulnerabilityStatusName ? (
    <CustomEnumChipCell value={row.report.vulnerabilityStatusName} objectType="vulnerability" field="status" />
  ) : (
    <span className={cn(!row.isOpen && 'text-muted-foreground')}>{exposureStatusLabel(row)}</span>
  )

export const ExposureAssetCell: React.FC<{ row: TExposureRow; showReportLink?: boolean }> = ({ row, showReportLink = false }) => {
  const openObjectSheet = useOpenObjectSheet()

  return (
    <div className="flex flex-wrap items-center gap-2">
      {row.asset ? (
        <ObjectSheetLink id={row.asset.id} kind={ObjectAssociationNodeEnum.ASSET} label={exposureAssetLabel(row.asset)} onOpenSheet={openObjectSheet} />
      ) : (
        <span className="text-muted-foreground italic">{exposureAssetLabel(row.asset)}</span>
      )}
      {row.hiddenAssetCount > 0 && <span className="text-muted-foreground">+{pluralizeWithCount(row.hiddenAssetCount, 'more asset')}</span>}
      {row.isCurrent ? (
        <Badge variant="outline">This record</Badge>
      ) : (
        showReportLink && row.isFirstForReport && <ObjectSheetLink id={row.report.id} kind={ObjectAssociationNodeEnum.VULNERABILITY} label="View report" onOpenSheet={openObjectSheet} />
      )}
    </div>
  )
}
