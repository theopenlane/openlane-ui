'use client'

import { ColumnDef } from '@tanstack/react-table'
import { formatDate } from '@/utils/date'
import { Button } from '@repo/ui/button'
import { CheckCheck, XIcon } from 'lucide-react'

export type NdaRequestRow = {
  id: string
  firstName: string
  lastName: string
  companyName: string
  email: string
  createdAt: string
  updatedAt?: string
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
      accessorKey: 'updatedAt',
      header: 'Approved On',
      cell: ({ row }) => (row.original.updatedAt ? formatDate(row.original.updatedAt) : '-'),
      size: 120,
    })
  }

  if (showSignedOn) {
    columns.push({
      accessorKey: 'updatedAt',
      header: 'Signed On',
      cell: ({ row }) => (row.original.updatedAt ? formatDate(row.original.updatedAt) : '-'),
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
