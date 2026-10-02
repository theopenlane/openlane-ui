'use client'

import { type ColumnDef } from '@repo/ui/table-types'
import { formatDate } from '@/utils/date'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Button } from '@repo/ui/button'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import { AssessmentResponseAssessmentResponseStatus } from '@repo/codegen/src/schema'
import { AssessmentResponseStatusLabel } from '@/components/shared/enum-mapper/assessment-response-enum'

export type DeliveryRow = {
  id: string
  email?: string | null
  assignedAt: string
  dueDate?: string | null
  status: AssessmentResponseAssessmentResponseStatus
  sendAttempts: number
  emailDeliveredAt?: string | null
  completedAt?: string | null
  document?: { id: string; data: unknown } | null
}

type DeliveryColumnCallbacks = {
  onResend: (row: DeliveryRow) => void
  onViewResponse: (row: DeliveryRow) => void
  onDelete: (row: DeliveryRow) => void
  canResend?: boolean
  canDelete?: boolean
}

export const getDeliveryColumns = ({ onResend, onViewResponse, onDelete, canResend = false, canDelete = false }: DeliveryColumnCallbacks): ColumnDef<DeliveryRow>[] => [
  {
    accessorKey: 'email',
    header: 'Recipient',
    size: 250,
    minSize: 150,
    cell: ({ cell }) => <div className="truncate">{(cell.getValue() as string | null | undefined) ?? ''}</div>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 120,
    minSize: 120,
    cell: ({ row }) => <AssessmentResponseStatusLabel status={row.original.status} />,
  },
  {
    accessorKey: 'assignedAt',
    header: 'Sent Date',
    size: 140,
    cell: ({ row }) => formatDate(row.getValue('assignedAt')),
  },
  {
    accessorKey: 'dueDate',
    header: 'Due Date',
    size: 140,
    cell: ({ row }) => formatDate(row.getValue('dueDate')),
  },
  {
    accessorKey: 'completedAt',
    header: 'Completed',
    size: 140,
    cell: ({ row }) => formatDate(row.getValue('completedAt')),
  },
  {
    accessorKey: 'sendAttempts',
    header: 'Resent',
    size: 80,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const showViewResponse = row.original.status === AssessmentResponseAssessmentResponseStatus.COMPLETED
      const showResend = !showViewResponse && canResend
      const hasAnyAction = showViewResponse || showResend || canDelete
      if (!hasAnyAction) {
        return null
      }
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" aria-label="Open delivery actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {showViewResponse && <DropdownMenuItem onClick={() => onViewResponse(row.original)}>See Response</DropdownMenuItem>}
            {showResend && <DropdownMenuItem onClick={() => onResend(row.original)}>Resend</DropdownMenuItem>}
            {canDelete && (
              <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => onDelete(row.original)}>
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
