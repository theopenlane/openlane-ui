'use client'

import { ColumnDef } from '@tanstack/react-table'
import { formatDate } from '@/utils/date'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Button } from '@repo/ui/button'
import { MoreHorizontal } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import { AssessmentResponseAssessmentResponseStatus } from '@repo/codegen/src/schema'

export type DeliveryRow = {
  id: string
  email: string
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
}

const statusVariantMap: Record<AssessmentResponseAssessmentResponseStatus, 'green' | 'blue' | 'default' | 'destructive'> = {
  [AssessmentResponseAssessmentResponseStatus.COMPLETED]: 'green',
  [AssessmentResponseAssessmentResponseStatus.SENT]: 'blue',
  [AssessmentResponseAssessmentResponseStatus.NOT_STARTED]: 'default',
  [AssessmentResponseAssessmentResponseStatus.OVERDUE]: 'destructive',
}

export const getDeliveryColumns = ({ onResend, onViewResponse }: DeliveryColumnCallbacks): ColumnDef<DeliveryRow>[] => [
  {
    accessorKey: 'email',
    header: 'Recipient',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as AssessmentResponseAssessmentResponseStatus
      const label = status.replaceAll('_', ' ')
      return <Badge variant={statusVariantMap[status] || 'default'}>{label}</Badge>
    },
  },
  {
    accessorKey: 'assignedAt',
    header: 'Sent Date',
    cell: ({ row }) => formatDate(row.getValue('assignedAt')),
  },
  {
    accessorKey: 'dueDate',
    header: 'Due Date',
    cell: ({ row }) => formatDate(row.getValue('dueDate')),
  },
  {
    accessorKey: 'completedAt',
    header: 'Completed',
    cell: ({ row }) => formatDate(row.getValue('completedAt')),
  },
  {
    accessorKey: 'sendAttempts',
    header: 'Resent',
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const isCompleted = row.original.status === AssessmentResponseAssessmentResponseStatus.COMPLETED
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isCompleted ? (
              <DropdownMenuItem onClick={() => onViewResponse(row.original)}>See Response</DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onResend(row.original)}>Resend</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
