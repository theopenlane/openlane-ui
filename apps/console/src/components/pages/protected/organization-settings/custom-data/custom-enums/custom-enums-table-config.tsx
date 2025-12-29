'use client'

import * as React from 'react'
import { ColumnDef, Row } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import ColorCell from '../shared/color-cell'
import { useUpdateCustomTypeEnum } from '@/lib/graphql-hooks/custom-type-enums'

export type EnumType = 'system' | 'custom'

export type CustomEnumRow = {
  id: string
  name: string
  enumGroup: string
  type: EnumType
  description?: string
  colorHex: string
}

function TypeBadge({ type }: { type: EnumType }) {
  return (
    <Badge variant={type === 'system' ? 'secondary' : 'outline'} className="capitalize">
      {type}
    </Badge>
  )
}

type SelectedEnum = { id: string; name: string }

type ColumnsParams = {
  selectedEnums: SelectedEnum[]
  setSelectedEnums: React.Dispatch<React.SetStateAction<SelectedEnum[]>>
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export const useGetCustomEnumColumns = ({ selectedEnums, setSelectedEnums, onEdit, onDelete }: ColumnsParams): ColumnDef<CustomEnumRow>[] => {
  const { mutateAsync: updateEnum } = useUpdateCustomTypeEnum()

  const toggleSelection = (item: SelectedEnum) => {
    setSelectedEnums((prev) => {
      const exists = prev.some((c) => c.id === item.id)
      return exists ? prev.filter((c) => c.id !== item.id) : [...prev, item]
    })
  }

  return [
    {
      id: 'select',
      header: ({ table }) => {
        const currentPageRows = table.getRowModel().rows.map((row) => row.original)
        const allSelected = currentPageRows.length > 0 && currentPageRows.every((row) => selectedEnums.some((s) => s.id === row.id))

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked) => {
                const isChecked = Boolean(checked)
                setSelectedEnums((prev) => {
                  const filtered = prev.filter((p) => !currentPageRows.some((row) => row.id === p.id))
                  if (isChecked) {
                    return [...filtered, ...currentPageRows.map((r) => ({ id: r.id, name: r.name }))]
                  }
                  return filtered
                })
              }}
            />
          </div>
        )
      },
      cell: ({ row }: { row: Row<CustomEnumRow> }) => {
        const { id, name } = row.original
        const isChecked = selectedEnums.some((s) => s.id === id)

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={isChecked} onCheckedChange={() => toggleSelection({ id, name })} />
          </div>
        )
      },
      size: 40,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <div className="text-sm font-medium">{row.original.name}</div>,
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => <TypeBadge type={row.original.type} />,
      size: 30,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <div
          className="text-sm text-muted-foreground line-clamp-4 overflow-hidden"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {row.original.description || '—'}
        </div>
      ),
      size: 300,
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
            await updateEnum({
              id,
              input: { color },
            })
          }}
        />
      ),
      size: 10,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        if (row.original.type === 'system') {
          return null
        }
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              <DropdownMenuItem onClick={() => onEdit(row.original.id)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Enum
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(row.original.id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Enum
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      size: 8,
    },
  ]
}
