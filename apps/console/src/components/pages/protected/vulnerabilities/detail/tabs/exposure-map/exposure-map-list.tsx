'use client'

import React from 'react'
import { Checkbox } from '@repo/ui/checkbox'
import { cn } from '@repo/ui/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import { type SlaDefinitionsNodeNonNull } from '@/lib/graphql-hooks/sla-definition'
import { ResponsibilityCell } from '@/components/shared/crud-base/columns/responsibility-cell'
import { pluralizeWithCount } from '@/utils/strings'
import { type TEnvironmentGroup } from './exposure-model'
import { ExposureAssetCell, ExposureDueCell, ExposureStatusCell } from './exposure-cells'
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

const ExposureMapList: React.FC<TExposureMapListProps> = ({ groups, slaDefinitions, selectedIds, allSelected, onToggle, onToggleAll, canSelect }) => {
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
                    <ExposureAssetCell row={row} showReportLink />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{row.report.manifestPath || '—'}</TableCell>
                  <TableCell>{row.report.source || '—'}</TableCell>
                  <TableCell>
                    <ExposureStatusCell row={row} />
                  </TableCell>
                  <TableCell>
                    <ExposureDueCell row={row} slaDefinitions={slaDefinitions} />
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
