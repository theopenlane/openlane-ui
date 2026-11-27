import React from 'react'
import { type ColumnDef } from '@repo/ui/table-types'
import { TruncatedCell } from '@repo/ui/data-table'
import { cn } from '@repo/ui/lib/utils'
import { CustomEnumChipCell } from '@/components/shared/crud-base/columns/custom-enum-chip-cell'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { ObjectAssociationMap } from '@/components/shared/enum-mapper/object-association-enum'
import { RiskIconMapper } from '@/components/shared/enum-mapper/risk-enum'
import ObjectSheetLink from '@/components/shared/object-sheet-link/object-sheet-link'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { SeverityChip } from '@/components/shared/severity/severity-chip'
import { RiskRiskStatus } from '@repo/codegen/src/schema'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { isOneOf } from '@/utils/type-guards'
import { formatDate } from '@/utils/date'
import { toHumanLabel } from '@/utils/strings'
import { isExposurePastDue, type TExposureItem, type TExposureKind } from './exposure-items'

const EXPOSURE_TYPE_NAMES: Record<TExposureKind, ObjectTypes> = {
  [ObjectAssociationNodeEnum.VULNERABILITY]: ObjectTypes.VULNERABILITY,
  [ObjectAssociationNodeEnum.FINDING]: ObjectTypes.FINDING,
  [ObjectAssociationNodeEnum.RISKS]: ObjectTypes.RISK,
}

export const exposureKindLabel = (kind: TExposureKind) => toHumanLabel(EXPOSURE_TYPE_NAMES[kind])

const isRiskStatus = isOneOf(Object.values(RiskRiskStatus))

const ExposureTypeCell = ({ kind }: { kind: TExposureKind }) => {
  const { icon: Icon, color } = ObjectAssociationMap[kind]
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon size={14} className="shrink-0" style={{ color: `var(${color})` }} aria-hidden />
      {exposureKindLabel(kind)}
    </span>
  )
}

const ExposureStatusCell = ({ item }: { item: TExposureItem }) => {
  if (item.kind === ObjectAssociationNodeEnum.RISKS && item.status) {
    return (
      <span className="inline-flex items-center gap-1.5">
        {isRiskStatus(item.status) && RiskIconMapper[item.status]}
        {getEnumLabel(item.status)}
      </span>
    )
  }
  if (item.status) return <CustomEnumChipCell value={item.status} objectType={item.kind === ObjectAssociationNodeEnum.FINDING ? 'finding' : 'vulnerability'} field="status" />
  return <span>{item.isOpen ? 'Open' : 'Closed'}</span>
}

type TGetExposureColumnsArgs = {
  showType: boolean
  onOpenSheet: (id: string, kind: ObjectAssociationNodeEnum) => void
  resolveSource: (definitionID: string | null, fallback: string | null) => string | null
}

export const getExposureColumns = ({ showType, onOpenSheet, resolveSource }: TGetExposureColumnsArgs): ColumnDef<TExposureItem>[] => [
  ...(showType ? [{ accessorKey: 'kind', header: 'Type', size: 140, minSize: 90, cell: ({ row }) => <ExposureTypeCell kind={row.original.kind} /> } satisfies ColumnDef<TExposureItem>] : []),
  {
    accessorKey: 'title',
    header: 'Name',
    size: 220,
    minSize: 90,
    cell: ({ row }) => (
      <div className="min-w-0">
        <div className="truncate">
          <ObjectSheetLink id={row.original.id} kind={row.original.kind} label={row.original.title} onOpenSheet={onOpenSheet} />
        </div>
        {row.original.subtitle && (
          <div className="text-muted-foreground">
            <TruncatedCell>{row.original.subtitle}</TruncatedCell>
          </div>
        )}
      </div>
    ),
  },
  { accessorKey: 'severity', header: 'Severity', size: 95, minSize: 90, cell: ({ row }) => <SeverityChip severity={row.original.severity} /> },
  { accessorKey: 'status', header: 'Status', size: 110, minSize: 90, cell: ({ row }) => <ExposureStatusCell item={row.original} /> },
  {
    accessorKey: 'source',
    header: 'Source',
    size: 120,
    minSize: 90,
    cell: ({ row }) => resolveSource(row.original.sourceDefinitionID, row.original.source) ?? <span className="text-muted-foreground">-</span>,
  },
  {
    accessorKey: 'dueDate',
    header: 'Due',
    size: 170,
    cell: ({ row }) =>
      row.original.isOpen && row.original.dueDate ? (
        <span className={cn('whitespace-nowrap', isExposurePastDue(row.original) && 'text-danger')}>{formatDate(row.original.dueDate.toISOString())}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
  },
]
