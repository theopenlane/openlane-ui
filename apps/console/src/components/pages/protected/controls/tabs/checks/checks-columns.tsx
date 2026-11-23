import React from 'react'
import { type ColumnDef } from '@repo/ui/table-types'
import { TruncatedCell } from '@repo/ui/truncated-cell'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { TagsCell } from '@/components/shared/crud-base/columns/tags-cell'
import { CheckResultStatusLabel } from '@/components/shared/enum-mapper/check-result-enum'
import { Link } from '@/components/shared/link/link'
import ObjectSheetLink from '@/components/shared/object-sheet-link/object-sheet-link'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { type CheckResultsNode } from '@/lib/graphql-hooks/check-result'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import { getObjectDisplayName } from '@/utils/object-display-name'
import { toValidHref } from '@/utils/normalizeUrl'
import { pluralizeWithCount } from '@/utils/strings'

type TOpenSheet = (id: string, kind: ObjectAssociationNodeEnum) => void

const SourceCell = ({ check }: { check: CheckResultsNode }) => {
  const href = check.externalURI ? toValidHref(check.externalURI) : ''

  if (href) {
    return (
      <Link href={href} newTab className="whitespace-nowrap">
        {check.source}
      </Link>
    )
  }

  return <span className="whitespace-nowrap">{check.source}</span>
}

const FindingsCell = ({ check, onOpenSheet }: { check: CheckResultsNode; onOpenSheet: TOpenSheet }) => {
  const findings = getNodes(check.findings)

  if (findings.length === 0) {
    return <>-</>
  }

  const hiddenCount = check.findings.totalCount - findings.length

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
      {hiddenCount > 0 && <span className="text-muted-foreground">and {pluralizeWithCount(hiddenCount, 'more finding')}</span>}
    </div>
  )
}

export const getCheckColumns = (onOpenSheet: TOpenSheet): ColumnDef<CheckResultsNode>[] => [
  {
    accessorKey: 'status',
    header: 'Status',
    size: 110,
    cell: ({ row }) => <CheckResultStatusLabel status={row.original.status} />,
  },
  {
    accessorKey: 'details',
    header: 'Check',
    minSize: 280,
    cell: ({ row }) => (row.original.details ? <TruncatedCell lineClamp={2}>{row.original.details}</TruncatedCell> : '-'),
  },
  {
    accessorKey: 'source',
    header: 'Source',
    size: 160,
    cell: ({ row }) => <SourceCell check={row.original} />,
  },
  {
    accessorKey: 'findings',
    header: 'Findings',
    size: 220,
    cell: ({ row }) => <FindingsCell check={row.original} onOpenSheet={onOpenSheet} />,
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated',
    size: 140,
    cell: ({ row }) => <DateCell value={row.original.updatedAt} variant="timesince" />,
  },
  {
    accessorKey: 'lastObservedAt',
    header: 'Last Observed',
    size: 140,
    cell: ({ row }) => <DateCell value={row.original.lastObservedAt} variant="timesince" />,
  },
  {
    accessorKey: 'tags',
    header: 'Tags',
    size: 180,
    cell: ({ row }) => <TagsCell tags={row.original.tags} />,
  },
]
