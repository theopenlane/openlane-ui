import React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { formatDateSince } from '@/utils/date'
import { EvidenceStatusOptions, FilterIcons } from '@/components/shared/enum-mapper/evidence-enum'
import type { FilterField } from '@/types'

export type EvidenceRow = {
  id: string
  displayID: string
  name: string
  updatedAt?: string | null
}

export const getEvidenceFilterFields = (): FilterField[] => [
  { key: 'nameContainsFold', label: 'Name', type: 'text', icon: FilterIcons.Name },
  { key: 'statusIn', label: 'Status', type: 'multiselect', options: EvidenceStatusOptions, icon: FilterIcons.Status },
  { key: 'creationDate', label: 'Created', type: 'dateRange', icon: FilterIcons.Date },
  { key: 'renewalDate', label: 'Renewed', type: 'dateRange', icon: FilterIcons.Date },
]

export const getEvidenceColumns = (onOpenEvidence: (id: string) => void): ColumnDef<EvidenceRow>[] => [
  {
    accessorKey: 'displayID',
    header: () => <span className="whitespace-nowrap">ID</span>,
    cell: ({ row }) => (
      <button type="button" className="text-blue-500 hover:underline" onClick={() => onOpenEvidence(row.original.id)}>
        {row.original.displayID}
      </button>
    ),
    size: 140,
  },
  {
    accessorKey: 'name',
    header: () => <span className="whitespace-nowrap">Name</span>,
    cell: ({ row }) => <span className="truncate">{row.original.name}</span>,
  },
  {
    accessorKey: 'updatedAt',
    header: () => <span className="whitespace-nowrap">Last Updated</span>,
    cell: ({ row }) => <span className="whitespace-nowrap">{formatDateSince(row.original.updatedAt)}</span>,
    size: 140,
  },
]
