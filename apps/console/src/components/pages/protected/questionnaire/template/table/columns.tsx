import { type ColumnDef } from '@tanstack/react-table'
import { type Template, type User, TemplateTemplateKind } from '@repo/codegen/src/schema'
import { formatDate, formatTimeSince } from '@/utils/date'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { Avatar } from '@/components/shared/avatar/avatar'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { MoreHorizontal, Pencil, FilePlus, Trash2, Copy } from 'lucide-react'
import { TruncatedCell } from '@repo/ui/data-table'
import { SystemTooltip } from '@repo/ui/system-tooltip'

type Params = {
  userMap?: Record<string, User>
  onEdit?: (template: Template) => void
  onDelete?: (template: Template) => void
  onCreateQuestionnaire?: (template: Template) => void
  onDuplicate?: (template: Template) => void
  canEdit?: boolean
  canDelete?: boolean
  canCreateQuestionnaire?: boolean
  canDuplicate?: boolean
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
      cell: ({ row, cell }) => (
        <div className="flex items-center gap-2">
          <span className="font-bold">{cell.getValue() as string}</span>
          {row.original.systemOwned && (
            <SystemTooltip
              className="bg-border"
              icon={
                <Badge variant="select" className="shrink-0">
                  Openlane Managed
                </Badge>
              }
              content={<p>This template is managed by Openlane. To make changes you must duplicate it first.</p>}
            />
          )}
          {row.original.kind === TemplateTemplateKind.EXTERNAL_INTAKE && (
            <SystemTooltip
              className="bg-success/16"
              icon={
                <Badge variant="green" className="shrink-0">
                  Object Creation
                </Badge>
              }
              content={<p>Submitting this template automatically creates and updates records in your Openlane organization.</p>}
            />
          )}
        </div>
      ),
      size: 200,
      minSize: 100,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      size: 250,
      minSize: 100,
      cell: ({ cell }) => <TruncatedCell>{(cell.getValue() as string) || '-'}</TruncatedCell>,
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
        return <div>{value ? getEnumLabel(value) : '-'}</div>
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
        const canDuplicateTemplate = !!params?.canDuplicate
        const hasAnyAction = canEditTemplate || canDeleteTemplate || canCreateQuestionnaire || canDuplicateTemplate

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
                {canDuplicateTemplate && (
                  <DropdownMenuItem onClick={() => params?.onDuplicate?.(row.original)}>
                    <Copy className="h-4 w-4" />
                    Duplicate
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
