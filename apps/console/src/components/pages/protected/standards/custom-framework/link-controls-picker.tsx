'use client'

import React, { useMemo, useState } from 'react'
import { SearchIcon } from 'lucide-react'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { DataTable } from '@repo/ui/data-table'
import { type ColumnDef } from '@repo/ui/table-types'
import { type TPagination } from '@repo/ui/pagination-types'
import { type ControlWhereInput } from '@repo/codegen/src/schema'
import { useGetAllControls, type ControlsNode } from '@/lib/graphql-hooks/control'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { mergeWhere } from '@/lib/merge-where'
import { ControlIconMapper16 } from '@/components/shared/enum-mapper/control-enum'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { pluralizeWithCount } from '@/utils/strings'
import { useAsyncCommandSearch } from '@repo/ui/use-async-command-search'
import { UNLINKED_CUSTOM_CONTROLS_WHERE } from './custom-framework'
import { type TLinkedControl } from './hooks/use-custom-framework-form-schema'

const INCLUDE_VARS = { includeTitle: true, includeCategory: true, includeStatus: true }

const searchWhere = (term: string): ControlWhereInput | undefined => (term ? { or: [{ refCodeContainsFold: term }, { titleContainsFold: term }, { categoryContainsFold: term }] } : undefined)

const getControlId = (control: ControlsNode) => control.id

const toLinkedControl = ({ id, refCode }: ControlsNode): TLinkedControl => ({ id, refCode })

type TLinkControlsPickerProps = {
  value: TLinkedControl[]
  onChange: (value: TLinkedControl[]) => void
}

export const LinkControlsPicker: React.FC<TLinkControlsPickerProps> = ({ value, onChange }) => {
  const { searchText, setSearchText, debouncedTerm, getIsSearching } = useAsyncCommandSearch()
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)

  const where = useMemo(() => mergeWhere<ControlWhereInput>([UNLINKED_CUSTOM_CONTROLS_WHERE, searchWhere(debouncedTerm)]), [debouncedTerm])
  const { controls, paginationMeta, isPending, isFetching } = useGetAllControls({ where, pagination, includeVars: INCLUDE_VARS })

  const selectedIds = useMemo(() => new Set(value.map((control) => control.id)), [value])
  const columns = useMemo<ColumnDef<ControlsNode>[]>(() => {
    const pageAllSelected = controls.length > 0 && controls.every((control) => selectedIds.has(control.id))
    const toggle = (control: ControlsNode, checked: boolean) => onChange(checked ? [...value, toLinkedControl(control)] : value.filter((selected) => selected.id !== control.id))
    const togglePage = (checked: boolean) => {
      const pageIds = new Set(controls.map(getControlId))
      const others = value.filter((selected) => !pageIds.has(selected.id))
      onChange(checked ? [...others, ...controls.map(toLinkedControl)] : others)
    }

    return [
      {
        id: 'select',
        header: () => <Checkbox aria-label="Select all controls on this page" checked={pageAllSelected} onCheckedChange={(checked) => togglePage(checked === true)} />,
        cell: ({ row }) => <Checkbox aria-label={`Select ${row.original.refCode}`} checked={selectedIds.has(row.original.id)} onCheckedChange={(checked) => toggle(row.original, checked === true)} />,
        size: 50,
        minSize: 50,
      },
      { accessorKey: 'refCode', header: 'Ref Code', size: 120, minSize: 100 },
      { accessorKey: 'title', header: 'Title', size: 280, minSize: 160, cell: ({ row }) => row.original.title || '-' },
      { accessorKey: 'category', header: 'Category', size: 160, minSize: 120, cell: ({ row }) => row.original.category || '-' },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 160,
        minSize: 120,
        cell: ({ row }) => {
          const { status } = row.original
          if (!status) return '-'
          return (
            <span className="flex items-center gap-2">
              {ControlIconMapper16[status]}
              {getEnumLabel(status)}
            </span>
          )
        },
      },
    ]
  }, [controls, selectedIds, value, onChange])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          value={searchText}
          name="linkControlsSearch"
          placeholder="Search by ref code, title or category"
          onChange={(event) => {
            setSearchText(event.currentTarget.value)
            setPagination(DEFAULT_PAGINATION)
          }}
          icon={<SearchIcon size={16} />}
          iconPosition="left"
          variant="searchTable"
        />
        <div className="flex items-center gap-3 text-sm text-muted-foreground" aria-live="polite">
          <span>{pluralizeWithCount(value.length, 'control')} selected</span>
          {value.length > 0 && (
            <Button type="button" variant="link" className="text-blue-500" onClick={() => onChange([])}>
              Clear selection
            </Button>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Only custom controls that are not part of another framework can be linked. A linked control stays one record, with its evidence, owner and status.
      </p>
      <DataTable
        columns={columns}
        data={controls}
        loading={isPending || getIsSearching(isFetching)}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={paginationMeta}
        getRowId={getControlId}
        noResultsText={debouncedTerm ? 'No custom controls match your search.' : 'No unlinked custom controls in your organization yet.'}
        tableKey={undefined}
      />
    </div>
  )
}
