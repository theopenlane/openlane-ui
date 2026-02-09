'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@repo/ui/checkbox'
import { FilterField } from '@/types'
import { SubprocessorsFilterIcons } from '@/components/shared/enum-mapper/subprocessors-enum'
import { CountryFlag } from '@repo/ui/country-flag'
import { formatDate } from '@/utils/date'
import { Avatar } from '@/components/shared/avatar/avatar'
import { User } from '@repo/codegen/src/schema'
import { DeleteTrustCenterSubprocessorCell } from './delete-trust-center-subcontrol-cell'
import { Button } from '@repo/ui/button'
import { Pencil } from 'lucide-react'
import Link from 'next/link'

export type SubprocessorTableItem = {
  id: string
  name: string
  description: string
  logo: string | null
  category: string | null
  countries: string[]
  createdAt: string | null
  createdBy: string | null
  updatedAt: string | null
  updatedBy: string | null
}

type Params = {
  selectedRows: { id: string }[]
  setSelectedRows: React.Dispatch<React.SetStateAction<{ id: string }[]>>
  userMap: Record<string, User>
}

type ColumnConfig = {
  columns: ColumnDef<SubprocessorTableItem>[]
  mappedColumns: { accessorKey: string; header: string }[]
}

export const getSubprocessorsColumns = ({ selectedRows, setSelectedRows, userMap }: Params): ColumnConfig => {
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
      cell: ({ row }) => {
        const isChecked = selectedRows.some((r) => r.id === row.original.id)

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={isChecked} onCheckedChange={() => toggleSelection({ id: row.original.id })} />
          </div>
        )
      },
      size: 50,
      maxSize: 50,
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
    },

    {
      accessorKey: 'name',
      header: 'Name',
      meta: {
        exportPrefix: 'subprocessor.name',
      },
      minSize: 80,
      cell: ({ row }) => {
        const logo = row.original.logo
        return (
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {!!logo && <img src={logo} alt={row.original.name} width={32} height={32} className="rounded-md object-contain bg-white border" />}
            <span>{row.original.name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => row.original.description || '—',
      meta: {
        exportPrefix: 'subprocessor.description',
      },
      minSize: 160,
    },
    {
      accessorKey: 'countries',
      header: 'Countries',
      meta: {
        exportPrefix: 'countries',
      },
      cell: ({ row }) => {
        const codes = row.original.countries ?? []

        if (!codes.length) return '—'

        return (
          <div className="flex items-center gap-1 flex-wrap">
            {codes.map((iso3) => (
              <CountryFlag key={iso3} value={iso3} />
            ))}
          </div>
        )
      },
      minSize: 80,
    },

    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => row.original.category || '—',
      minSize: 80,
    },

    {
      accessorKey: 'createdAt',
      header: 'Created At',
      minSize: 100,
      cell: ({ row }) => (row.original.createdAt ? formatDate(row.original.createdAt) : '—'),
    },

    {
      header: 'Created By',
      accessorKey: 'createdBy',
      minSize: 100,
      cell: ({ row }) => {
        const user = userMap[row.original.createdBy ?? '']

        return user ? (
          <div className="flex items-center space-x-1">
            <Avatar entity={user} className="w-6 h-6" />
            <p>{user.displayName}</p>
          </div>
        ) : (
          <span className="text-muted-foreground italic">Deleted user</span>
        )
      },
    },

    {
      accessorKey: 'updatedAt',
      header: 'Updated At',
      minSize: 100,
      cell: ({ row }) => (row.original.updatedAt ? formatDate(row.original.updatedAt) : '—'),
    },

    {
      header: 'Updated By',
      accessorKey: 'updatedBy',
      minSize: 100,
      cell: ({ row }) => {
        const user = userMap[row.original.updatedBy ?? '']

        return user ? (
          <div className="flex items-center space-x-1">
            <Avatar entity={user} className="w-6 h-6" />
            <p>{user.displayName}</p>
          </div>
        ) : (
          <span className="text-muted-foreground italic">Deleted user</span>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1 justify-end">
          <Link href={`/trust-center/subprocessors?id=${row.original.id}`}>
            <Button variant="secondary">
              <Pencil />
            </Button>
          </Link>
          <DeleteTrustCenterSubprocessorCell subprocessorId={row.original.id} subprocessorName={row.original.name} />
        </div>
      ),
      maxSize: 30,
      size: 30,
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
    key: 'trustCenterSubprocessorKindNameContainsFold',
    label: 'Category',
    type: 'text',
    icon: SubprocessorsFilterIcons.Category,
  },
  // {
  //   key: 'country',
  //   label: 'Country',
  //   type: 'text',
  //   icon: SubprocessorsFilterIcons.Country,
  // },
]
