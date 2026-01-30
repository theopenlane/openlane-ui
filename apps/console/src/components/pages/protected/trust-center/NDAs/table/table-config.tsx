'use client'

import { ColumnDef } from '@tanstack/react-table'
import { formatDate } from '@/utils/date'
import { Button } from '@repo/ui/button'
import { Building2, Calendar, CheckCheck, Mail, XIcon } from 'lucide-react'
import { FilterField } from '@/types'

export type NdaRequestRow = {
  id: string
  firstName: string
  lastName: string
  companyName: string
  email: string
  createdAt: string
  approvedAt?: string
  signedAt?: string
}

type NdaRequestColumnOptions = {
  showActions?: boolean
  showApprovedOn?: boolean
  showSignedOn?: boolean
  onApprove?: (id: string) => void
  onDeny?: (id: string) => void
  actionLoadingId?: string | null
  actionLoadingType?: 'approve' | 'deny' | null
}

export const getNdaRequestColumns = ({
  showActions,
  showApprovedOn,
  showSignedOn,
  onApprove,
  onDeny,
  actionLoadingId,
  actionLoadingType,
}: NdaRequestColumnOptions = {}): ColumnDef<NdaRequestRow>[] => {
  const columns: ColumnDef<NdaRequestRow>[] = [
    { accessorKey: 'firstName', header: 'First Name', size: 120 },
    { accessorKey: 'lastName', header: 'Last Name', size: 120 },
    { accessorKey: 'companyName', header: 'Company', size: 120 },
    { accessorKey: 'email', header: 'Email', size: 120 },
    {
      accessorKey: 'createdAt',
      header: 'Requested On',
      cell: ({ row }) => (row.original.createdAt ? formatDate(row.original.createdAt) : '-'),
      size: 120,
    },
  ]

  if (showApprovedOn) {
    columns.push({
      accessorKey: 'approvedAt',
      header: 'Approved On',
      cell: ({ row }) => (row.original.approvedAt ? formatDate(row.original.approvedAt) : '-'),
      size: 120,
    })
  }

  if (showSignedOn) {
    columns.push({
      accessorKey: 'signedAt',
      header: 'Signed On',
      cell: ({ row }) => (row.original.signedAt ? formatDate(row.original.signedAt) : '-'),
      size: 120,
    })
  }

  if (showActions) {
    columns.push({
      accessorKey: 'actions',
      header: 'Action',
      cell: ({ row }) => {
        const requestId = row.original.id
        const isApproving = actionLoadingId === requestId && actionLoadingType === 'approve'
        const isDenying = actionLoadingId === requestId && actionLoadingType === 'deny'

        return (
          <div className="flex items-center gap-2 justify-end" onClick={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()}>
            <Button loading={isApproving} disabled={isApproving || isDenying} onClick={() => onApprove?.(requestId)} icon={<CheckCheck size={16} />} iconPosition="left">
              Approve
            </Button>
            <Button variant="secondary" loading={isDenying} disabled={isApproving || isDenying} onClick={() => onDeny?.(requestId)} icon={<XIcon size={16} />} iconPosition="left">
              Deny
            </Button>
          </div>
        )
      },
      size: 120,
    })
  }

  return columns
}

export const ndaRequestsFilterFields: FilterField[] = [
  {
    key: 'companyNameContainsFold',
    label: 'Company Name',
    type: 'text',
    icon: Building2,
  },
  {
    key: 'createdAt',
    label: 'Created At',
    type: 'dateRange',
    icon: Calendar,
  },
  {
    key: 'emailContainsFold',
    label: 'Email',
    type: 'text',
    icon: Mail,
  },
]
