'use client'

import { ColumnDef, Row } from '@tanstack/react-table'
import { Checkbox } from '@repo/ui/checkbox'
import { FilterField } from '@/types'
import { FilterIcons } from '@/components/shared/enum-mapper/tokens-enum'

export type SubprocessorTableItem = {
  id: string
  name: string
  description: string
  logo: string | null
}

type SubprocessorsColumnsProps = {
  selectedRows: { id: string }[]
  setSelectedRows: React.Dispatch<React.SetStateAction<{ id: string }[]>>
}

export const getSubprocessorsColumns = ({ selectedRows, setSelectedRows }: SubprocessorsColumnsProps) => {
  const toggleSelection = (row: { id: string }) => {
    setSelectedRows((prev) => {
      const exists = prev.some((r) => r.id === row.id)
      return exists ? prev.filter((r) => r.id !== row.id) : [...prev, row]
    })
  }

  const columns: ColumnDef<SubprocessorTableItem>[] = [
    {
      id: 'select',
      header: ({ table }) => {
        const rows = table.getRowModel().rows.map((r) => r.original)
        const allSelected = rows.every((r) => selectedRows.some((s) => s.id === r.id))

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked) => {
                const newSelection = checked
                  ? [...selectedRows.filter((s) => !rows.some((r) => r.id === s.id)), ...rows.map((r) => ({ id: r.id }))]
                  : selectedRows.filter((s) => !rows.some((r) => r.id === s.id))

                setSelectedRows(newSelection)
              }}
            />
          </div>
        )
      },
      cell: ({ row }: { row: Row<SubprocessorTableItem> }) => {
        const isChecked = selectedRows.some((r) => r.id === row.original.id)

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={isChecked} onCheckedChange={() => toggleSelection({ id: row.original.id })} />
          </div>
        )
      },
      size: 20,
      enableSorting: false,
      enableHiding: false,
    },

    {
      accessorKey: 'logo',
      header: 'Logo',
      cell: ({ row }) => {
        const logo = row.original.logo

        if (!logo) return <div className="text-muted-foreground">—</div>

        return (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt={row.original.name} width={32} height={32} className="rounded object-contain bg-white border" />
          </>
        )
      },
    },

    {
      accessorKey: 'name',
      header: 'Name',
    },

    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => row.original.description || '—',
    },
  ]

  const mappedColumns = columns
    .filter((column): column is { accessorKey: string; header: string } => 'accessorKey' in column && typeof column.accessorKey === 'string' && typeof column.header === 'string')
    .map((column) => ({
      accessorKey: column.accessorKey,
      header: column.header,
    }))

  return { columns, mappedColumns }
}

export const subprocessorsFilterFields: FilterField[] = [
  {
    key: 'nameContainsFold',
    label: 'Name contains',
    type: 'text',
    icon: FilterIcons.Name,
  },
  {
    key: 'descriptionContainsFold',
    label: 'Description contains',
    type: 'text',
    icon: FilterIcons.Name,
  },
]
