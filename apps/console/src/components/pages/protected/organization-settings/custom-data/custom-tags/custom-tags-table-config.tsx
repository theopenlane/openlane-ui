'use client'

import * as React from 'react'
import { useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import ColorCell from '../shared/color-cell'
import { FALLBACK_COLOR } from '../shared/constants'
import { normalizeHexColor } from '@/utils/normalizeHexColor'
import { useUpdateTag } from '@/lib/graphql-hooks/tag-definition'
import { AuthorCell } from '@/components/shared/user-display/author-cell'
import { formatDate, formatDateSince } from '@/utils/date'
import { type TagDefinition, type User } from '@repo/codegen/src/schema'
import { type AuthorToken } from '@/lib/authors'
import { TruncatedCell } from '@repo/ui/data-table'

type ColumnsParams = {
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  userMap?: Record<string, User>
  tokenMap?: Record<string, AuthorToken>
  canEditTags?: boolean
  canDeleteTags?: boolean
}

export const useGetCustomTagColumns = ({ onEdit, onDelete, userMap, tokenMap, canEditTags = true, canDeleteTags = true }: ColumnsParams) => {
  const { mutateAsync: updateTag } = useUpdateTag()

  const columns = useMemo<ColumnDef<TagDefinition>[]>(() => {
    const actionsCol: ColumnDef<TagDefinition> = {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
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
    }

    return [
      {
        accessorKey: 'name',
        header: 'Tag',
        cell: ({ row }) => (
          <Badge variant="outline" className="flex items-center gap-1 w-fit">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: normalizeHexColor(row.original.color) ?? FALLBACK_COLOR }} />
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
        cell: ({ row }) => <TruncatedCell className="text-sm text-muted-foreground line-clamp-2 whitespace-normal">{row.original.description || '—'}</TruncatedCell>,
        size: 200,
      },
      {
        id: 'color',
        header: 'Color',
        cell: ({ row }) => (
          <ColorCell
            id={row.original.id}
            initialColor={row.original.color}
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
        cell: ({ row }) => <AuthorCell id={row.original.createdBy} userMap={userMap} tokenMap={tokenMap} />,
        size: 200,
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
        cell: ({ row }) => <AuthorCell id={row.original.updatedBy} userMap={userMap} tokenMap={tokenMap} />,
        size: 200,
      },
      {
        accessorKey: 'updatedAt',
        header: 'Last Updated',
        cell: ({ cell }) => <span className="text-sm">{formatDateSince(cell.getValue() as string)}</span>,
        size: 130,
      },
      ...(canEditTags || canDeleteTags ? [actionsCol] : []),
    ]
  }, [onEdit, onDelete, userMap, tokenMap, updateTag, canEditTags, canDeleteTags])

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
