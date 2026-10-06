'use client'

import { type ColumnDef } from '@repo/ui/table-types'
import { formatDate } from '@/utils/date'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Button } from '@repo/ui/button'
import { FileText, MoreHorizontal, Trash2 } from 'lucide-react'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import AssessmentResponseView from '../shared/assessment-response-view'
import ObjectSheetLink from '@/components/shared/object-sheet-link/object-sheet-link'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { AssessmentResponseAssessmentResponseStatus } from '@repo/codegen/src/schema'
import { AssessmentResponseStatusLabel } from '@/components/shared/enum-mapper/assessment-response-enum'

export type DeliveryRow = {
  id: string
  name?: string | null
  identityHolderId?: string | null
  email?: string | null
  assignedAt: string
  dueDate?: string | null
  status: AssessmentResponseAssessmentResponseStatus
  sendAttempts: number
  emailDeliveredAt?: string | null
  completedAt?: string | null
  document?: { id: string; data: unknown } | null
}

const RESPONSE_PREVIEW_ITEMS = 3

const hasViewableResponse = (row: DeliveryRow) => row.status === AssessmentResponseAssessmentResponseStatus.COMPLETED && !!row.document?.data

type DeliveryColumnCallbacks = {
  jsonconfig: unknown
  onOpenSheet: (id: string, kind: ObjectAssociationNodeEnum) => void
  onResend: (row: DeliveryRow) => void
  onViewResponse: (row: DeliveryRow) => void
  onDelete: (row: DeliveryRow) => void
  canResend?: boolean
  canDelete?: boolean
}

export const getDeliveryColumns = ({ jsonconfig, onOpenSheet, onResend, onViewResponse, onDelete, canResend = false, canDelete = false }: DeliveryColumnCallbacks): ColumnDef<DeliveryRow>[] => [
  {
    accessorKey: 'name',
    header: 'Name',
    size: 180,
    minSize: 120,
    cell: ({ row }) => {
      const { name, identityHolderId } = row.original
      if (!name) return null
      return identityHolderId ? (
        <ObjectSheetLink id={identityHolderId} kind={ObjectAssociationNodeEnum.IDENTITY_HOLDER} label={name} onOpenSheet={onOpenSheet} />
      ) : (
        <div className="truncate">{name}</div>
      )
    },
  },
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
    id: 'response',
    header: 'Response',
    size: 150,
    cell: ({ row }) =>
      hasViewableResponse(row.original) ? (
        <SystemTooltip
          portal
          side="left"
          icon={
            <Button type="button" variant="link" className="font-normal text-blue-500" icon={<FileText />} iconPosition="left" onClick={() => onViewResponse(row.original)}>
              View response
            </Button>
          }
          content={<AssessmentResponseView jsonconfig={jsonconfig} data={row.original.document?.data} maxItems={RESPONSE_PREVIEW_ITEMS} />}
        />
      ) : null,
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
      const showResend = row.original.status !== AssessmentResponseAssessmentResponseStatus.COMPLETED && canResend
      const hasAnyAction = showResend || canDelete
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
