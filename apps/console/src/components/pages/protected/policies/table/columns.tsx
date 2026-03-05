import { type ColumnDef } from '@tanstack/react-table'
import { type ApiToken, type Group, type InternalPolicy, type User } from '@repo/codegen/src/schema.ts'
import { Avatar } from '@/components/shared/avatar/avatar.tsx'
import { KeyRound } from 'lucide-react'
import React from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { DocumentStatusBadge, DocumentStatusTooltips } from '@/components/shared/enum-mapper/policy-enum'
import DelegateCell from './delegate-cell'
import ApproverCell from './approver-cell'
import { LinkedControlsCell } from './linked-controls-cell'
import { LinkedProceduresCell } from './linked-procedures-cell'
import { type CustomTypeEnumOption } from '@/lib/graphql-hooks/custom-type-enum'
import { CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'
import { TagsCell } from '@/components/shared/crud-base/columns/tags-cell'
import { BooleanCell } from '@/components/shared/crud-base/columns/boolean-cell'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { createSelectColumn } from '@/components/shared/crud-base/columns/select-column'
import { formatDate } from '@/utils/date'

type TPoliciesColumnsProps = {
  users?: User[]
  tokens?: ApiToken[]
  selectedPolicies: { id: string }[]
  setSelectedPolicies: React.Dispatch<React.SetStateAction<{ id: string }[]>>
  enumOptions: CustomTypeEnumOption[]
}

export const getPoliciesColumns = ({ users, tokens, selectedPolicies, setSelectedPolicies, enumOptions }: TPoliciesColumnsProps) => {
  const columns: ColumnDef<InternalPolicy>[] = [
    createSelectColumn<InternalPolicy>(selectedPolicies, setSelectedPolicies),
    {
      accessorKey: 'id',
      header: 'ID',
      size: 270,
      minSize: 270,
      cell: ({ row }) => <div className="text-muted-foreground">{row.original.id}</div>,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      size: 200,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ cell }) => (
        <div className="flex items-center gap-2">
          {cell.row.original.status && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DocumentStatusBadge status={cell.row.original.status} />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{DocumentStatusTooltips[cell.row.original.status]}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      ),
      minSize: 150,
      size: 150,
    },
    {
      accessorKey: 'summary',
      header: 'Summary',
      minSize: 200,
      size: 500,
      cell: ({ cell }) => {
        const summary = cell.getValue() as string
        return <div className="line-clamp-4 text-justify">{summary === '' ? 'N/A' : summary}</div>
      },
    },
    {
      accessorKey: 'approvalRequired',
      header: 'Approval Required',
      cell: ({ cell }) => <BooleanCell value={cell.getValue() as boolean | null | undefined} />,
    },
    {
      accessorKey: 'approver',
      header: 'Approver',
      meta: {
        exportPrefix: 'approver.displayName',
      },
      size: 160,
      cell: ({ row }) => {
        const approver = row.original.approver
        const policyId = row.original.id
        return <ApproverCell approver={approver} policyId={policyId} />
      },
    },
    {
      accessorKey: 'delegate',
      header: 'Delegate',
      meta: {
        exportPrefix: 'delegate.displayName',
      },
      size: 160,
      cell: ({ row }) => {
        const delegate = row.original.delegate
        const policyId = row.original.id
        return <DelegateCell delegate={delegate as Group | null} policyId={policyId} />
      },
    },
    {
      accessorKey: 'internalPolicyKindName',
      header: 'Type',
      size: 160,
      cell: ({ cell }) => <CustomTypeEnumValue value={(cell.getValue() as string) || ''} options={enumOptions ?? []} placeholder="-" />,
    },
    {
      accessorKey: 'reviewDue',
      header: 'Review Due',
      size: 100,
      cell: ({ cell }) => {
        const value = cell.getValue() as string | null
        return value ? formatDate(value) : '-'
      },
    },
    {
      accessorKey: 'reviewFrequency',
      header: 'Review Frequency',
      size: 100,
      cell: ({ cell }) => {
        const value = cell.getValue<string>()
        return <span className="capitalize">{value ? value.toLowerCase() : '-'}</span>
      },
    },
    {
      accessorKey: 'revision',
      header: 'Revision',
      size: 100,
      cell: ({ cell }) => cell.getValue()?.toString() ?? '-',
    },
    {
      accessorKey: 'tags',
      header: 'Tags',
      size: 140,
      cell: ({ row }) => <TagsCell tags={row.original.tags} />,
    },
    {
      header: 'Linked Controls',
      accessorKey: 'linkedControls',
      meta: {
        exportPrefix: 'controls.refCode',
      },
      size: 220,
      cell: LinkedControlsCell,
    },
    {
      header: 'Linked Procedures',
      accessorKey: 'linkedProcedures',
      meta: {
        exportPrefix: 'procedures.name',
      },
      size: 220,
      cell: LinkedProceduresCell,
    },
    {
      accessorKey: 'createdBy',
      header: 'Created by',
      size: 200,
      cell: ({ row }) => {
        const userId = row.original.createdBy
        const token = tokens?.find((item) => item.id === userId)
        const user = users?.find((item) => item.id === userId)

        if (!token && !user) {
          return 'Deleted user'
        }

        return (
          <div className="flex items-center gap-2">
            {token ? <KeyRound size={18} /> : <Avatar entity={user} />}
            {token ? token.name : user?.displayName || '-'}
          </div>
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      size: 150,
      cell: ({ cell }) => <DateCell value={cell.getValue() as string} />,
    },
    {
      accessorKey: 'updatedBy',
      header: 'Updated By',
      size: 200,
      cell: ({ row }) => {
        const userId = row.original.updatedBy
        const token = tokens?.find((item) => item.id === userId)
        const user = users?.find((item) => item.id === userId)

        if (!token && !user) {
          return 'Deleted user'
        }

        return (
          <div className="flex items-center gap-2">
            {token ? <KeyRound size={18} /> : <Avatar entity={user} />}
            {token ? token.name : user?.displayName || '-'}
          </div>
        )
      },
    },
    {
      accessorKey: 'updatedAt',
      header: 'Last Updated',
      size: 100,
      cell: ({ cell }) => <DateCell value={cell.getValue() as string} variant="timesince" />,
    },
  ]

  const mappedColumns = columns
    .filter((column): column is { accessorKey: string; header: string } => 'accessorKey' in column && typeof column.accessorKey === 'string' && 'header' in column && typeof column.header === 'string')
    .map((column) => ({
      accessorKey: column.accessorKey,
      header: column.header,
    }))

  return { columns, mappedColumns }
}
