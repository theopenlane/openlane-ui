import { ColumnDef } from '@tanstack/react-table'
import { Template, User } from '@repo/codegen/src/schema'
import { formatDate, formatTimeSince } from '@/utils/date'
import { formatEnumLabel } from '@/utils/enumToLabel'
import { Avatar } from '@/components/shared/avatar/avatar'
import { Button } from '@repo/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { MoreHorizontal, Pencil, FilePlus, Trash2 } from 'lucide-react'

type Params = {
  userMap?: Record<string, User>
  onEdit?: (template: Template) => void
  onDelete?: (template: Template) => void
  onCreateQuestionnaire?: (template: Template) => void
  canEdit?: boolean
  canDelete?: boolean
  canCreateQuestionnaire?: boolean
}

export const getTemplateColumns = (params?: Params) => {
  const userMap = params?.userMap || {}

  const columns: ColumnDef<Template>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      size: 270,
      minSize: 270,
      maxSize: 270,
      cell: ({ row }) => <div className="text-muted-foreground">{row.original.id}</div>,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ cell }) => <div className="font-bold">{cell.getValue() as string}</div>,
      size: 200,
      minSize: 100,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      size: 250,
      minSize: 100,
      cell: ({ cell }) => <div className="truncate">{(cell.getValue() as string) || '-'}</div>,
    },
    {
      accessorKey: 'environmentName',
      header: 'Environment',
      size: 150,
      minSize: 100,
      cell: ({ cell }) => <div>{(cell.getValue() as string) || '-'}</div>,
    },
    {
      accessorKey: 'kind',
      header: 'Kind',
      size: 150,
      minSize: 100,
      cell: ({ cell }) => {
        const value = cell.getValue() as string
        return <div>{value ? formatEnumLabel(value) : '-'}</div>
      },
    },
    {
      accessorKey: 'scopeName',
      header: 'Scope',
      size: 150,
      minSize: 100,
      cell: ({ cell }) => <div>{(cell.getValue() as string) || '-'}</div>,
    },
    {
      accessorKey: 'systemOwned',
      header: 'System Owned',
      size: 120,
      minSize: 100,
      cell: ({ cell }) => <div>{cell.getValue() ? 'Yes' : 'No'}</div>,
    },
    {
      accessorKey: 'createdBy',
      header: 'Created by',
      size: 200,
      cell: ({ row }) => {
        const userId = row.original.createdBy
        const user = userMap?.[userId ?? '']
        return user ? (
          <div className="flex items-center gap-2">
            <Avatar entity={user} />
            {user.displayName || '-'}
          </div>
        ) : (
          'Deleted user'
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      size: 150,
      cell: ({ cell }) => <span className="whitespace-nowrap">{formatDate(cell.getValue() as string)}</span>,
    },
    {
      accessorKey: 'updatedBy',
      header: 'Updated By',
      size: 200,
      cell: ({ row }) => {
        const userId = row.original.updatedBy
        const user = userMap?.[userId ?? '']
        return user ? (
          <div className="flex items-center gap-2">
            <Avatar entity={user} />
            {user.displayName || '-'}
          </div>
        ) : (
          'Deleted user'
        )
      },
    },
    {
      accessorKey: 'updatedAt',
      header: 'Last Updated',
      size: 100,
      cell: ({ cell }) => <span className="whitespace-nowrap">{formatTimeSince(cell.getValue() as string)}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const isSystemOwned = row.original.systemOwned === true
        const canEditTemplate = !!params?.canEdit && !isSystemOwned
        const canDeleteTemplate = !!params?.canDelete && !isSystemOwned
        const canCreateQuestionnaire = !!params?.canCreateQuestionnaire
        const hasAnyAction = canEditTemplate || canDeleteTemplate || canCreateQuestionnaire

        if (!hasAnyAction) {
          return null
        }
        return (
          <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary">
                  <MoreHorizontal className="h-4 w-4 text-brand" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-40">
                {canEditTemplate && (
                  <DropdownMenuItem onClick={() => params?.onEdit?.(row.original)}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {canCreateQuestionnaire && (
                  <DropdownMenuItem onClick={() => params?.onCreateQuestionnaire?.(row.original)}>
                    <FilePlus className="h-4 w-4" />
                    Create Questionnaire
                  </DropdownMenuItem>
                )}
                {canDeleteTemplate && (
                  <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => params?.onDelete?.(row.original)}>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
      size: 40,
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
