import React from 'react'
import { type ColumnDef, type VisibilityState } from '@repo/ui/table-types'
import { TruncatedCell } from '@repo/ui/truncated-cell'
import { CheckResultOrderField } from '@repo/codegen/src/schema'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { TagsCell } from '@/components/shared/crud-base/columns/tags-cell'
import { CheckResultStatusLabel } from '@/components/shared/enum-mapper/check-result-enum'
import { ExternalLinkValue } from '@/components/shared/external-link/external-link-value'
import { Link } from '@/components/shared/link/link'
import ObjectSheetLink from '@/components/shared/object-sheet-link/object-sheet-link'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { type CheckResultIncludeVars, type CheckResultsNode } from '@/lib/graphql-hooks/check-result'
import { integrationDefinitionHref } from '@/lib/integrations/run-health'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import { getObjectDisplayName } from '@/utils/object-display-name'
import { toValidHref } from '@/utils/normalizeUrl'
import { pluralizeWithCount } from '@/utils/strings'

type TOpenSheet = (id: string, kind: ObjectAssociationNodeEnum) => void

type TCheckColumnsOptions = {
  onOpenSheet: TOpenSheet
  canManageIntegrations: boolean
}

export const CHECK_SORT_FIELDS: { key: CheckResultOrderField; label: string }[] = [
  { key: CheckResultOrderField.STATUS, label: 'Status' },
  { key: CheckResultOrderField.source, label: 'Source' },
  { key: CheckResultOrderField.updated_at, label: 'Updated' },
  { key: CheckResultOrderField.created_at, label: 'Created' },
  { key: CheckResultOrderField.observed_at, label: 'Last Observed' },
]

export const CHECK_HIDDEN_COLUMNS: VisibilityState = {
  findings: false,
  externalURI: false,
  createdAt: false,
  [CheckResultOrderField.observed_at]: false,
  tags: false,
}

const SourceCell = ({ check, canManageIntegrations }: { check: CheckResultsNode; canManageIntegrations: boolean }) => {
  const definitionId = canManageIntegrations && check.managedBy ? check.sourceDefinitionID : undefined

  return <TruncatedCell>{definitionId ? <Link href={integrationDefinitionHref(definitionId)}>{check.source}</Link> : check.source}</TruncatedCell>
}

const FindingsCell = ({ check, onOpenSheet }: { check: CheckResultsNode; onOpenSheet: TOpenSheet }) => {
  const findings = getNodes(check.findings)

  if (findings.length === 0) {
    return <>-</>
  }

  const hiddenCount = (check.findings?.totalCount ?? 0) - findings.length

  return (
    <div className="flex flex-col gap-1">
      {findings.map((finding) => {
        const label = getObjectDisplayName(finding)

        return (
          <span key={finding.id} className="inline-flex min-w-0 items-center gap-1.5">
            <span className="min-w-0 truncate">
              <ObjectSheetLink id={finding.id} kind={ObjectAssociationNodeEnum.FINDING} label={label} onOpenSheet={onOpenSheet} />
            </span>
            <Link href={getHrefForObjectType(ObjectAssociationNodeEnum.FINDING, { id: finding.id })} newTab aria-label={`Open ${label} in a new tab`} />
          </span>
        )
      })}
      {hiddenCount > 0 && <span className="text-muted-foreground">and {pluralizeWithCount(hiddenCount, 'more open finding')}</span>}
    </div>
  )
}

export const getCheckColumns = ({ onOpenSheet, canManageIntegrations }: TCheckColumnsOptions): ColumnDef<CheckResultsNode>[] => [
  {
    accessorKey: 'status',
    header: 'Status',
    size: 130,
    maxSize: 200,
    cell: ({ row }) => <CheckResultStatusLabel status={row.original.status} />,
  },
  {
    accessorKey: 'details',
    header: 'Check',
    size: 280,
    minSize: 280,
    cell: ({ row }) => (row.original.details ? <TruncatedCell lineClamp={2}>{row.original.details}</TruncatedCell> : '-'),
  },
  {
    accessorKey: 'source',
    header: 'Source',
    size: 170,
    maxSize: 400,
    cell: ({ row }) => <SourceCell check={row.original} canManageIntegrations={canManageIntegrations} />,
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated',
    size: 150,
    maxSize: 250,
    cell: ({ row }) => <DateCell value={row.original.updatedAt} variant="timesince" />,
  },
  {
    accessorKey: 'findings',
    header: 'Open Findings',
    size: 220,
    maxSize: 500,
    meta: {
      gqlInclude: ['includeFindings'] satisfies (keyof CheckResultIncludeVars)[],
    },
    cell: ({ row }) => <FindingsCell check={row.original} onOpenSheet={onOpenSheet} />,
  },
  {
    accessorKey: 'externalURI',
    header: 'External URI',
    size: 200,
    maxSize: 500,
    cell: ({ row }) => <ExternalLinkValue value={toValidHref(row.original.externalURI)} fallback={row.original.externalURI ? <TruncatedCell>{row.original.externalURI}</TruncatedCell> : '-'} />,
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    size: 150,
    maxSize: 250,
    cell: ({ row }) => <DateCell value={row.original.createdAt} variant="timesince" />,
  },
  {
    accessorKey: CheckResultOrderField.observed_at,
    header: 'Last Observed',
    size: 190,
    maxSize: 250,
    cell: ({ row }) => <DateCell value={row.original.lastObservedAt} variant="timesince" />,
  },
  {
    accessorKey: 'tags',
    header: 'Tags',
    size: 180,
    maxSize: 400,
    cell: ({ row }) => <TagsCell tags={row.original.tags} />,
  },
]
