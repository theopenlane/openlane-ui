'use client'

import * as React from 'react'
import { useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import ColorCell from '../shared/color-cell'
import { useUpdateTag } from '@/lib/graphql-hooks/tag-definition'
import { Avatar } from '@/components/shared/avatar/avatar'
import { formatDate, formatDateSince } from '@/utils/date'
import { TagDefinition, User } from '@repo/codegen/src/schema'

type ColumnsParams = {
  tags: TagDefinition[]
  selected: Record<string, boolean>
  setSelected: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  userMap?: Record<string, User>
  canEditTags?: boolean
  canDeleteTags?: boolean
}

export const normalizeColor = (color?: string | null) => {
  if (!color) return '#64748B'
  return color.startsWith('#') ? color : `#${color}`
}

export const useGetCustomTagColumns = ({ tags, selected, setSelected, onEdit, onDelete, userMap, canEditTags = true, canDeleteTags = true }: ColumnsParams) => {
  const { mutateAsync: updateTag } = useUpdateTag()

  const columns = useMemo<ColumnDef<TagDefinition>[]>(() => {
    const allVisibleSelected = tags.length > 0 && tags.every((t) => selected[t.id])
    const someVisibleSelected = tags.some((t) => selected[t.id]) && !allVisibleSelected

    return [
      {
        id: 'select',
        header: () => (
          <Checkbox
            checked={allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false}
            onCheckedChange={(checked) => {
              const next = Boolean(checked)
              setSelected((prev) => {
                const copy = { ...prev }
                tags.forEach((r) => (copy[r.id] = next))
                return copy
              })
            }}
          />
        ),
        cell: ({ row }) => <Checkbox checked={Boolean(selected[row.original.id])} onCheckedChange={(checked) => setSelected((prev) => ({ ...prev, [row.original.id]: Boolean(checked) }))} />,
        size: 30,
      },
      {
        accessorKey: 'name',
        header: 'Tag',
        cell: ({ row }) => (
          <Badge variant="outline" className="flex items-center gap-1 w-fit">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: normalizeColor(row.original.color) }} />
            <span>{row.original.name}</span>
          </Badge>
        ),
      },
      {
        accessorKey: 'aliases',
        header: 'Aliases',
        cell: ({ row }) => <div className="text-sm text-muted-foreground">{Array.isArray(row.original.aliases) ? row.original.aliases.join(', ') : row.original.aliases || '-'}</div>,
      },
      {
        accessorKey: 'systemOwned',
        id: 'type',
        header: 'Type',
        cell: ({ row }) => <Badge variant={row.original.systemOwned ? 'secondary' : 'outline'}>{row.original.systemOwned ? 'System' : 'Custom'}</Badge>,
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => <div className="text-sm text-muted-foreground line-clamp-2">{row.original.description || '—'}</div>,
        size: 300,
      },
      {
        id: 'color',
        header: 'Color',
        cell: ({ row }) => (
          <ColorCell
            id={row.original.id}
            initialColor={normalizeColor(row.original.color)}
            disabled={!!row.original.systemOwned || !canEditTags}
            onSave={async (id, color) => {
              await updateTag({
                updateTagDefinitionId: id,
                input: { color },
              })
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
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }: { row: { original: TagDefinition } }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="-mr-2" variant="secondary">
                <MoreHorizontal className="h-4 w-4 text-brand" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              {canEditTags && (
                <DropdownMenuItem onClick={() => onEdit?.(row.original.id)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Tag
                </DropdownMenuItem>
              )}
              {canDeleteTags && (
                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => onDelete?.(row.original.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Tag
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        size: 40,
      },
    ]
  }, [tags, selected, setSelected, onEdit, onDelete, userMap, updateTag, canEditTags, canDeleteTags])

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
