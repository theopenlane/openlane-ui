import { type EvidenceWhereInput } from '@repo/codegen/src/schema'
import { defineFilterFields } from '@/types'
import React from 'react'
import type { ColumnDef } from '@repo/ui/table-types'
import { formatDateSince } from '@/utils/date'
import { EvidenceStatusIconLabel, EvidenceStatusOptions } from '@/components/shared/enum-mapper/evidence-enum'
import type { EvidenceEvidenceStatus, User } from '@repo/codegen/src/schema.ts'
import { type AuthorToken } from '@/lib/authors'
import { AuthorCell } from '@/components/shared/user-display/author-cell'
import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'
import InheritedBadge from '@/components/shared/inherited-badge/inherited-badge'

export type EvidenceRow = {
  id: string
  name: string
  status?: EvidenceEvidenceStatus | null
  source?: string | null
  updatedAt?: string | null
  updatedBy?: string | null
}

export const getEvidenceFilterFields = () =>
  defineFilterFields<EvidenceWhereInput>()([
    { key: 'nameContainsFold', label: 'Name', type: 'text', icon: FilterIcons.Name },
    { key: 'statusIn', label: 'Status', type: 'multiselect', options: EvidenceStatusOptions, icon: FilterIcons.Status },
    { key: 'creationDate', label: 'Created', type: 'dateRange', icon: FilterIcons.Date },
    { key: 'renewalDate', label: 'Renewed', type: 'dateRange', icon: FilterIcons.Date },
    { key: 'scopeNameIn', label: 'Scope', type: 'text', icon: FilterIcons.Scope, nullableKey: 'scopeName' },
    { key: 'environmentNameIn', label: 'Environment', type: 'text', icon: FilterIcons.Environment, nullableKey: 'environmentName' },
    { key: 'externalUUIDContainsFold', label: 'External UUID', type: 'text', icon: FilterIcons.ID },
  ])

export const getEvidenceColumns = (
  onOpenEvidence: (id: string) => void,
  userMap: Record<string, User>,
  tokenMap: Record<string, AuthorToken>,
  inheritedFromMap?: Map<string, { refCode: string; href: string }[]>,
): ColumnDef<EvidenceRow>[] => [
  {
    accessorKey: 'name',
    header: () => <span className="whitespace-nowrap">Name</span>,
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <button type="button" className="text-blue-500 hover:underline truncate whitespace-nowrap text-left" onClick={() => onOpenEvidence(row.original.id)}>
          {row.original.name}
        </button>
        {inheritedFromMap?.has(row.original.id) && <InheritedBadge sources={inheritedFromMap.get(row.original.id) ?? []} />}
      </div>
    ),
    size: 220,
  },
  {
    accessorKey: 'status',
    header: () => <span className="whitespace-nowrap">Status</span>,
    cell: ({ row }) => <EvidenceStatusIconLabel status={row.original.status} />,
    size: 160,
  },
  {
    accessorKey: 'source',
    header: () => <span className="whitespace-nowrap">Source</span>,
    cell: ({ row }) => <span className="truncate whitespace-nowrap">{row.original.source || '-'}</span>,
    size: 180,
  },
  {
    accessorKey: 'updatedAt',
    header: () => <span className="whitespace-nowrap">Last Updated</span>,
    cell: ({ row }) => <span className="whitespace-nowrap">{formatDateSince(row.original.updatedAt)}</span>,
    size: 140,
  },
  {
    accessorKey: 'updatedBy',
    header: () => <span className="whitespace-nowrap">Last Updated By</span>,
    cell: ({ row }) => <AuthorCell id={row.original.updatedBy} userMap={userMap} tokenMap={tokenMap} className="flex items-center gap-2 whitespace-nowrap" />,
    size: 200,
  },
]
