'use client'

import React from 'react'
import { Badge } from '@repo/ui/badge'
import { Checkbox } from '@repo/ui/checkbox'
import { cn } from '@repo/ui/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import { type SlaDefinitionsNodeNonNull } from '@/lib/graphql-hooks/sla-definition'
import { ResponsibilityCell } from '@/components/shared/crud-base/columns/responsibility-cell'
import { CustomEnumChipCell } from '@/components/shared/crud-base/columns/custom-enum-chip-cell'
import ObjectSheetLink from '@/components/shared/object-sheet-link/object-sheet-link'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { useOpenObjectSheet } from '@/providers/sheet-navigation-provider'
import { getVulnerabilityDueDate } from '@/utils/vulnerability-due-date'
import { formatDate } from '@/utils/date'
import { pluralizeWithCount } from '@/utils/strings'
import { exposureAssetLabel, exposureStatusLabel, type TEnvironmentGroup, type TExposureRow } from './exposure-model'
import { EnvironmentChip } from './environment-chip'

type TExposureMapListProps = {
  groups: TEnvironmentGroup[]
  slaDefinitions: SlaDefinitionsNodeNonNull[]
  selectedIds: ReadonlySet<string>
  allSelected: boolean
  onToggle: (reportId: string, selected: boolean) => void
  onToggleAll: (selected: boolean) => void
  canSelect: boolean
}

const COLUMN_COUNT = 7

const EMPTY_USER_MAP = {}

const DueCell: React.FC<{ row: TExposureRow; slaDefinitions: SlaDefinitionsNodeNonNull[] }> = ({ row, slaDefinitions }) => {
  if (!row.isOpen) return <span className="text-muted-foreground">—</span>
  const { dueDate, pastDue } = getVulnerabilityDueDate(row.report, slaDefinitions)
  if (!dueDate) return <span className="text-muted-foreground">—</span>
  return <span className={cn('whitespace-nowrap', pastDue && 'text-destructive')}>{formatDate(dueDate.toISOString())}</span>
}

const StatusCell: React.FC<{ row: TExposureRow }> = ({ row }) =>
  row.report.vulnerabilityStatusName ? (
    <CustomEnumChipCell value={row.report.vulnerabilityStatusName} objectType="vulnerability" field="status" />
  ) : (
    <span className={cn(!row.isOpen && 'text-muted-foreground')}>{exposureStatusLabel(row)}</span>
  )

const ExposureMapList: React.FC<TExposureMapListProps> = ({ groups, slaDefinitions, selectedIds, allSelected, onToggle, onToggleAll, canSelect }) => {
  const openObjectSheet = useOpenObjectSheet()

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">{canSelect && <Checkbox aria-label="Select all reports" checked={allSelected} onCheckedChange={(checked) => onToggleAll(checked === true)} />}</TableHead>
            <TableHead>Asset</TableHead>
            <TableHead>Manifest</TableHead>
            <TableHead>Detected by</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due</TableHead>
            <TableHead>Assigned</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => (
            <React.Fragment key={group.environment}>
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={COLUMN_COUNT}>
                  <div className="flex items-center gap-2">
                    <EnvironmentChip environment={group.environment} />
                    <span className="text-xs text-muted-foreground">
                      {pluralizeWithCount(group.reportCount, 'report')} · {group.openCount} open
                    </span>
                  </div>
                </TableCell>
              </TableRow>
              {group.rows.map((row) => (
                <TableRow key={row.key} className={cn(!row.isOpen && 'text-muted-foreground', row.isCurrent && 'font-semibold')}>
                  <TableCell>
                    {canSelect && row.isFirstForReport && (
                      <Checkbox
                        aria-label={`Select report ${row.report.externalID}`}
                        checked={selectedIds.has(row.report.id)}
                        onCheckedChange={(checked) => onToggle(row.report.id, checked === true)}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {row.asset ? (
                        <ObjectSheetLink id={row.asset.id} kind={ObjectAssociationNodeEnum.ASSET} label={exposureAssetLabel(row.asset)} onOpenSheet={openObjectSheet} />
                      ) : (
                        <span className="text-muted-foreground italic">{exposureAssetLabel(row.asset)}</span>
                      )}
                      {row.hiddenAssetCount > 0 && <span className="text-muted-foreground">+{pluralizeWithCount(row.hiddenAssetCount, 'more asset')}</span>}
                      {row.isCurrent ? (
                        <Badge variant="outline">This record</Badge>
                      ) : (
                        row.isFirstForReport && <ObjectSheetLink id={row.report.id} kind={ObjectAssociationNodeEnum.VULNERABILITY} label="View report" onOpenSheet={openObjectSheet} />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{row.report.manifestPath || '—'}</TableCell>
                  <TableCell>{row.report.source || '—'}</TableCell>
                  <TableCell>
                    <StatusCell row={row} />
                  </TableCell>
                  <TableCell>
                    <DueCell row={row} slaDefinitions={slaDefinitions} />
                  </TableCell>
                  <TableCell>
                    <ResponsibilityCell
                      userMap={EMPTY_USER_MAP}
                      user={row.report.assignedToUser}
                      group={row.report.assignedToGroup}
                      personnel={row.report.assignedToIdentityHolder}
                      stringValue={row.report.assignedTo}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default ExposureMapList
