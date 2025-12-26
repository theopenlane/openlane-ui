'use client'

import * as React from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { useDebounce } from '@uidotdev/usehooks'
import { MoreHorizontal, Pencil, Trash2, Plus, Search } from 'lucide-react'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { Badge } from '@repo/ui/badge'
import { DataTable, getInitialPagination } from '@repo/ui/data-table'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { TableKeyEnum } from '@repo/ui/table-key'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'

type EnumType = 'system' | 'custom'

type CustomEnumRow = {
  id: string
  name: string
  enumGroup: string
  type: EnumType
  description?: string
  colorHex: string
}

const ENUM_GROUPS = ['All Enums', 'Task Kinds', 'Control Kinds', 'Risk Kinds', 'Risk Categories', 'Program Kinds', 'Policy Kinds', 'Procedure Kinds'] as const

const MOCK_ENUMS: CustomEnumRow[] = [
  {
    id: '1',
    name: 'Preventative',
    enumGroup: 'Risk Kinds',
    type: 'custom',
    description: 'Used for time-sensitive tasks',
    colorHex: '#60A5FA',
  },
  {
    id: '2',
    name: 'Detective',
    enumGroup: 'Risk Kinds',
    type: 'system',
    description: 'For pre-audit evidence reviews',
    colorHex: '#22C55E',
  },
  {
    id: '3',
    name: 'Corrective',
    enumGroup: 'Risk Kinds',
    type: 'custom',
    description: 'Related to 3rd-party management',
    colorHex: '#FB923C',
  },
  {
    id: '4',
    name: 'Vendor',
    enumGroup: 'Risk Categories',
    type: 'custom',
    description: 'For pre-audit evidence reviews',
    colorHex: '#2DD4BF',
  },
]

function ColorDot({ colorHex }: { colorHex: string }) {
  return <div className="h-3.5 w-3.5 rounded-full border border-border" style={{ backgroundColor: colorHex }} aria-label={`Color ${colorHex}`} title={colorHex} />
}

function TypeBadge({ type }: { type: EnumType }) {
  return (
    <Badge variant={type === 'system' ? 'secondary' : 'outline'} className="capitalize">
      {type === 'system' ? 'system' : 'Custom'}
    </Badge>
  )
}

const CreateEnumDialog: React.FC = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="h-8 px-2! gap-2">
          <Plus className="h-4 w-4" />
          Create Enum
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg rounded-xl">
        <DialogHeader>
          <DialogTitle>Create Enum</DialogTitle>
          <DialogDescription>Wire this to your create-enum form + mutation.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input placeholder="Enum value name (e.g. Preventative)" />
          <Input placeholder="Description" />
          <div className="flex justify-end">
            <Button>Create</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const CustomEnumsTab: React.FC = () => {
  const [view, setView] = React.useState<(typeof ENUM_GROUPS)[number]>('All Enums')
  const [searchValue, setSearchValue] = React.useState('')
  const debouncedSearch = useDebounce(searchValue, 250)

  const [selected, setSelected] = React.useState<Record<string, boolean>>({})
  const [pagination, setPagination] = React.useState<TPagination>(
    getInitialPagination(TableKeyEnum.CUSTOM_ENUMS, {
      ...DEFAULT_PAGINATION,
      pageSize: 10,
      query: { first: 10 },
    }),
  )

  const rows = React.useMemo(() => {
    const q = (debouncedSearch || '').trim().toLowerCase()

    return MOCK_ENUMS.filter((e) => {
      const matchesView = view === 'All Enums' ? true : e.enumGroup === view
      if (!matchesView) return false

      if (!q) return true
      const haystack = `${e.name} ${e.enumGroup} ${e.description ?? ''} ${e.type}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [debouncedSearch, view])

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [debouncedSearch, view])

  const allVisibleSelected = rows.length > 0 && rows.every((r) => selected[r.id])
  const someVisibleSelected = rows.some((r) => selected[r.id]) && !allVisibleSelected

  const columns: ColumnDef<CustomEnumRow>[] = [
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
      size: 44,
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
      size: 120,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => <div className="text-sm text-muted-foreground line-clamp-1 max-w-[520px]">{row.original.description || '—'}</div>,
    },
    {
      id: 'color',
      header: 'Color',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <ColorDot colorHex={row.original.colorHex} />
          <Button className="h-7 w-7" aria-label="Edit color">
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      ),
      size: 120,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="min-w-40">
            <DropdownMenuItem onClick={() => console.log('Edit enum', row.original.id)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Enum
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => console.log('Delete enum', row.original.id)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Enum
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      size: 90,
    },
  ]

  return (
    <>
      {/* Header row: View select (left) + search + create (right) */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">View:</div>
          <Select value={view} onValueChange={(v) => setView(v as (typeof ENUM_GROUPS)[number])}>
            <SelectTrigger className="h-8 w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ENUM_GROUPS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full max-w-[260px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder="Search enums..." className="pl-9 h-9" />
          </div>

          <CreateEnumDialog />
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <DataTable columns={columns} data={rows} loading={false} pagination={pagination} onPaginationChange={setPagination} tableKey={TableKeyEnum.CUSTOM_ENUMS} />
      </div>
    </>
  )
}

export default CustomEnumsTab
