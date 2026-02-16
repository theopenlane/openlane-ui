import React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { formatDateSince } from '@/utils/date'
import { EvidenceIconMapper, EvidenceStatusOptions, FilterIcons } from '@/components/shared/enum-mapper/evidence-enum'
import type { FilterField } from '@/types'
import type { ApiToken, EvidenceEvidenceStatus, User } from '@repo/codegen/src/schema.ts'
import { Avatar } from '@/components/shared/avatar/avatar'
import { KeyRound } from 'lucide-react'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

export type EvidenceRow = {
  id: string
  name: string
  status?: EvidenceEvidenceStatus | null
  source?: string | null
  updatedAt?: string | null
  updatedBy?: string | null
}

export const getEvidenceFilterFields = (): FilterField[] => [
  { key: 'nameContainsFold', label: 'Name', type: 'text', icon: FilterIcons.Name },
  { key: 'statusIn', label: 'Status', type: 'multiselect', options: EvidenceStatusOptions, icon: FilterIcons.Status },
  { key: 'creationDate', label: 'Created', type: 'dateRange', icon: FilterIcons.Date },
  { key: 'renewalDate', label: 'Renewed', type: 'dateRange', icon: FilterIcons.Date },
]

export const getEvidenceColumns = (onOpenEvidence: (id: string) => void, userMap: Record<string, User>, tokenMap: Record<string, ApiToken>): ColumnDef<EvidenceRow>[] => [
  {
    accessorKey: 'name',
    header: () => <span className="whitespace-nowrap">Name</span>,
    cell: ({ row }) => (
      <button type="button" className="text-blue-500 hover:underline truncate whitespace-nowrap" onClick={() => onOpenEvidence(row.original.id)}>
        {row.original.name}
      </button>
    ),
    size: 220,
  },
  {
    accessorKey: 'status',
    header: () => <span className="whitespace-nowrap">Status</span>,
    cell: ({ row }) => {
      const status = row.original.status
      if (!status) return <span className="text-muted-foreground">-</span>
      return (
        <div className="flex items-center space-x-2">
          {EvidenceIconMapper[status]}
          <span>{getEnumLabel(status)}</span>
        </div>
      )
    },
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
    cell: ({ row }) => {
      const updatedBy = row.original.updatedBy ?? ''
      const user = userMap[updatedBy]
      const token = tokenMap[updatedBy]

      if (!user && !token) {
        return <span className="text-muted-foreground italic">Deleted user</span>
      }

      return (
        <div className="flex items-center gap-2 whitespace-nowrap">
          {token ? <KeyRound size={16} /> : <Avatar entity={user} className="w-6 h-6" />}
          <span>{token ? token.name : user?.displayName || '-'}</span>
        </div>
      )
    },
    size: 200,
  },
]
