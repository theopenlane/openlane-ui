'use client'

import * as React from 'react'
import { useMemo } from 'react'
import { ColumnDef, Row } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'

import ColorCell from '../shared/color-cell'
import { Avatar } from '@/components/shared/avatar/avatar'
import { formatDate, formatDateSince } from '@/utils/date'
import { CustomTypeEnumOrderField, User } from '@repo/codegen/src/schema'
import { CustomTypeEnumNodeNonNull, useUpdateCustomTypeEnum } from '@/lib/graphql-hooks/custom-type-enums'
import { SystemTooltip } from '@repo/ui/system-tooltip'

type SelectedEnum = { id: string; name: string }

type ColumnsParams = {
  selectedEnums: SelectedEnum[]
  setSelectedEnums: React.Dispatch<React.SetStateAction<SelectedEnum[]>>
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  userMap?: Record<string, User>
}

const normalizeColor = (color?: string | null) => {
  if (!color) return '#64748B'
  return color.startsWith('#') ? color : `#${color}`
}

const TypeBadge = ({ systemOwned }: { systemOwned?: boolean | null }) => (
  <Badge variant={systemOwned ? 'secondary' : 'outline'} className="capitalize">
    {systemOwned ? 'System' : 'Custom'}
  </Badge>
)

export const useGetCustomEnumColumns = ({ selectedEnums, setSelectedEnums, onEdit, onDelete, userMap }: ColumnsParams) => {
  const { mutateAsync: updateEnum } = useUpdateCustomTypeEnum()

  const toggleSelection = React.useCallback(
    (item: SelectedEnum) => {
      setSelectedEnums((prev) => {
        const exists = prev.some((c) => c.id === item.id)
        return exists ? prev.filter((c) => c.id !== item.id) : [...prev, item]
      })
    },
    [setSelectedEnums],
  )

  const columns = useMemo<ColumnDef<CustomTypeEnumNodeNonNull>[]>(() => {
    const selectCol: ColumnDef<CustomTypeEnumNodeNonNull> = {
      id: 'select',
      header: ({ table }) => {
        const currentPage = table.getRowModel().rows.map((r) => r.original)
        const allSelected = currentPage.length > 0 && currentPage.every((r) => selectedEnums.some((s) => s.id === r.id))

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked) => {
                const isChecked = Boolean(checked)
                setSelectedEnums((prev) => {
                  const filtered = prev.filter((p) => !currentPage.some((r) => r.id === p.id))
                  if (isChecked) {
                    return [...filtered, ...currentPage.map((r) => ({ id: r.id, name: r.name }))]
                  }
                  return filtered
                })
              }}
            />
          </div>
        )
      },
      cell: ({ row }: { row: Row<CustomTypeEnumNodeNonNull> }) => {
        const { id, name } = row.original
        const isChecked = selectedEnums.some((s) => s.id === id)

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={isChecked} onCheckedChange={() => toggleSelection({ id, name })} />
          </div>
        )
      },
      size: 50,
      maxSize: 50,
    }

    const actionsCol: ColumnDef<CustomTypeEnumNodeNonNull> = {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const isSystem = !!row.original.systemOwned

        const trigger = (
          <Button className="-mr-2" variant="secondary" disabled={isSystem}>
            <MoreHorizontal className="h-4 w-4 text-brand" />
          </Button>
        )

        if (isSystem) {
          return (
            <SystemTooltip
              side="top"
              content="Aliases are commonly used terms that should use the same tag; this avoids duplication of similar tags."
              icon={<span className="inline-flex">{trigger}</span>}
            />
          )
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              <DropdownMenuItem onClick={() => onEdit?.(row.original.id)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Enum
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => onDelete?.(row.original.id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Enum
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      size: 40,
    }

    return [
      selectCol,
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <div className="text-sm font-medium">{row.original.name}</div>,
      },
      {
        accessorKey: 'systemOwned',
        id: 'type',
        header: 'Type',
        cell: ({ row }) => <TypeBadge systemOwned={row.original.systemOwned} />,
        size: 90,
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => <div className="text-sm text-muted-foreground line-clamp-2">{row.original.description || '—'}</div>,
        size: 300,
      },
      {
        accessorKey: 'objectType',
        header: 'Object Type',
        cell: ({ getValue }) => {
          const v = (getValue() as string) || ''
          return <span className="capitalize">{v ? v.split('_').join(' ') : '-'}</span>
        },
        size: 140,
      },
      {
        accessorKey: 'field',
        header: 'Field',
        cell: ({ getValue }) => <span>{(getValue() as string) || '-'}</span>,
        size: 140,
      },
      {
        id: 'color',
        header: 'Color',
        cell: ({ row }) => (
          <ColorCell
            id={row.original.id}
            initialColor={normalizeColor(row.original.color)}
            disabled={!!row.original.systemOwned}
            onSave={async (id, color) => {
              await updateEnum({ id, input: { color } })
            }}
          />
        ),
        size: 60,
      },
      {
        accessorKey: 'createdBy',
        header: 'Created By',
        cell: ({ row }) => {
          const user = userMap?.[row.original.createdBy ?? '']
          return user ? (
            <div className="flex items-center gap-1">
              <Avatar entity={user} className="w-6 h-6" />
              <p className="text-sm">{user.displayName}</p>
            </div>
          ) : (
            <span className="text-muted-foreground italic text-sm">Deleted user</span>
          )
        },
        size: 160,
      },
      {
        accessorKey: 'createdAt',
        header: 'Created At',
        cell: ({ cell }) => <span className="text-sm">{formatDate(cell.getValue() as string)}</span>,
        size: 130,
      },
      {
        accessorKey: 'updatedBy',
        header: 'Updated By',
        cell: ({ row }) => {
          const user = userMap?.[row.original.updatedBy ?? '']
          return user ? (
            <div className="flex items-center gap-1">
              <Avatar entity={user} className="w-6 h-6" />
              <p className="text-sm">{user.displayName}</p>
            </div>
          ) : (
            <span className="text-muted-foreground italic text-sm">Deleted user</span>
          )
        },
        size: 160,
      },
      {
        accessorKey: 'updatedAt',
        header: 'Last Updated',
        cell: ({ cell }) => <span className="text-sm">{formatDateSince(cell.getValue() as string)}</span>,
        size: 130,
      },
      actionsCol,
    ]
  }, [selectedEnums, setSelectedEnums, onEdit, onDelete, userMap, updateEnum, toggleSelection])

  const mappedColumns = useMemo(() => {
    return columns
      .filter((col): col is { accessorKey: string; header: string } => 'accessorKey' in col && typeof col.accessorKey === 'string' && typeof col.header === 'string')
      .map((col) => ({
        accessorKey: col.accessorKey,
        header: col.header,
      }))
  }, [columns])

  return { columns, mappedColumns }
}

export const CUSTOM_ENUMS_SORT_FIELDS: { key: CustomTypeEnumOrderField; label: string }[] = [
  { key: CustomTypeEnumOrderField.name, label: 'Name' },
  { key: CustomTypeEnumOrderField.created_at, label: 'Created At' },
  { key: CustomTypeEnumOrderField.updated_at, label: 'Updated At' },
  { key: CustomTypeEnumOrderField.object_type, label: 'Object Type' },
  { key: CustomTypeEnumOrderField.field, label: 'Field' },
]
