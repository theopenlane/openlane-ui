'use client'

import * as React from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import ColorCell from '../shared/color-cell'
import { useUpdateTag } from '@/lib/graphql-hooks/tags'

export type TagNodeLike = {
  id: string
  name: string
  aliases?: string[] | string | null
  systemOwned?: boolean | null
  description?: string | null
  color?: string | null
}

export type TagType = 'system' | 'custom'

export type CustomTagRow = {
  id: string
  name: string
  aliases?: string
  type: TagType
  description?: string
  colorHex: string
}

export const normalizeColor = (color?: string | null) => {
  if (!color) return '#64748B'
  return color.startsWith('#') ? color : `#${color}`
}

export function mapTagsToRows(tags: TagNodeLike[], search?: string): CustomTagRow[] {
  const mapped: CustomTagRow[] =
    tags?.map((t) => {
      const aliases = Array.isArray(t.aliases) ? t.aliases.join(', ') : t.aliases ?? undefined

      return {
        id: t.id,
        name: t.name,
        aliases: aliases || '-',
        type: t.systemOwned ? 'system' : 'custom',
        description: t.description || '-',
        colorHex: normalizeColor(t.color),
      }
    }) ?? []

  const q = (search || '').trim().toLowerCase()
  if (!q) return mapped

  return mapped.filter((t) => {
    const haystack = `${t.name} ${t.aliases ?? ''} ${t.description ?? ''} ${t.type}`.toLowerCase()
    return haystack.includes(q)
  })
}

function TypeBadge({ type }: { type: TagType }) {
  return (
    <Badge variant={type === 'system' ? 'secondary' : 'outline'} className="capitalize">
      {type === 'system' ? 'system' : 'Custom'}
    </Badge>
  )
}

function TagPill({ name }: { name: string }) {
  return (
    <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 font-medium">
      {name}
    </Badge>
  )
}

type ColumnsParams = {
  rows: CustomTagRow[]
  selected: Record<string, boolean>
  setSelected: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export const useGetCustomTagColumns = ({ rows, selected, setSelected, onEdit, onDelete }: ColumnsParams): ColumnDef<CustomTagRow>[] => {
  const allVisibleSelected = rows.length > 0 && rows.every((r) => selected[r.id])
  const someVisibleSelected = rows.some((r) => selected[r.id]) && !allVisibleSelected
  const { mutateAsync: updateTag } = useUpdateTag()
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
              rows.forEach((r) => (copy[r.id] = next))
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
      cell: ({ row }) => <TagPill name={row.original.name} />,
    },
    {
      accessorKey: 'aliases',
      header: 'Aliases',
      cell: ({ row }) => <div className="text-sm text-muted-foreground">{row.original.aliases || '-'}</div>,
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => <TypeBadge type={row.original.type} />,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => <div className="text-sm text-muted-foreground line-clamp-1 max-w-[520px]">{row.original.description || '-'}</div>,
    },
    {
      id: 'color',
      header: 'Color',
      cell: ({ row }) => (
        <ColorCell
          id={row.original.id}
          initialColor={row.original.colorHex}
          disabled={row.original.type === 'system'}
          onSave={async (id, color) => {
            await updateTag({
              updateTagDefinitionId: id,
              input: { color },
            })
          }}
        />
      ),
      size: 140,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40">
            <DropdownMenuItem onClick={() => onEdit?.(row.original.id)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Tag
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => onDelete?.(row.original.id)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Tag
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      size: 80,
    },
  ]
}
