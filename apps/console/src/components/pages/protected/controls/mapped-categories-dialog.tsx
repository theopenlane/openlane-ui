'use client'

import React, { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { useFormContext } from 'react-hook-form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { useGetStandards } from '@/lib/graphql-hooks/standards'
import { FolderIcon } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useUpdateControl } from '@/lib/graphql-hooks/controls'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { DataTable, getInitialPagination } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import { SaveButton } from '@/components/shared/save-button/save-button'

const MappedCategoriesDialog = ({ onClose }: { onClose: () => void }) => {
  const { id } = useParams<{ id: string }>()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [selectedStandardId, setSelectedStandardId] = useState<string | 'all'>('all')

  const { mutateAsync: updateControl, isPending } = useUpdateControl()

  const [pagination, setPagination] = useState<TPagination>(
    getInitialPagination(TableKeyEnum.CONTROLS_MAPPED_CATEGORIES, {
      ...DEFAULT_PAGINATION,
      page: 1,
      pageSize: 5,
      query: { first: 5 },
    }),
  )

  const { setValue, getValues } = useFormContext()
  const { data, isLoading } = useGetStandards({})

  const standards = useMemo(() => {
    return data?.standards?.edges?.map((edge) => edge?.node) || []
  }, [data])

  const filteredStandards = useMemo(() => {
    if (selectedStandardId === 'all') return standards
    return standards.filter((s) => s?.id === selectedStandardId)
  }, [standards, selectedStandardId])

  const allRows = useMemo(() => {
    return filteredStandards.flatMap((standard) =>
      (standard?.domains || []).map((domain) => ({
        id: `${standard?.id}:${domain}`,
        standardLabel: standard?.shortName ?? '',
        domain,
      })),
    )
  }, [filteredStandards])

  const pagedRows = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize
    return allRows.slice(start, start + pagination.pageSize)
  }, [allRows, pagination.page, pagination.pageSize])

  const toggle = (domain: string) => {
    setSelected((prev) => (prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]))
  }

  const handleSave = async () => {
    setValue('mappedCategories', selected)
    setOpen(false)
    if (!id) {
      return
    }

    await updateControl({
      updateControlId: id!,
      input: {
        mappedCategories: selected,
      },
    })
    onClose()
  }

  const filterOptions = useMemo(() => {
    return (standards ?? []).map((standard) => ({
      label: standard?.shortName ?? 'Unnamed standard',
      value: standard?.id ?? '',
    }))
  }, [standards])

  const handleOpen = () => {
    setOpen(true)
    const initial = getValues('mappedCategories') || []
    setSelected(initial)
  }

  const columns: ColumnDef<{ id: string; standardLabel: string; domain: string }, unknown>[] = useMemo(
    () => [
      {
        id: 'select',
        header: '',
        cell: ({ row }) => <Checkbox checked={selected.includes(row.original.domain)} onCheckedChange={() => toggle(row.original.domain)} />,
        size: 10,
        maxSize: 10,
      },
      {
        accessorKey: 'standardLabel',
        header: 'Standard',
        size: 100,
      },
      {
        accessorKey: 'domain',
        header: 'Category',
        size: 200,
      },
    ],
    [selected],
  )

  return (
    <>
      <div className="grid grid-cols-[140px_1fr] items-start gap-x-3 border-b border-border pb-3 last:border-b-0">
        <div className="flex items-start gap-2">
          <FolderIcon size={16} className="text-brand min-w-4 pt-0.5" />
          <div className="text-sm">Mapped categories</div>
        </div>
        <div className="text-sm">
          <Button variant="primary" className="h-8 px-2!" onClick={handleOpen} type="button">
            Set mappings
          </Button>
        </div>
      </div>

      <Dialog
        open={open}
        onOpenChange={(val) => {
          setOpen(val)
          if (!val) {
            onClose()
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Set mapped categories</DialogTitle>
          </DialogHeader>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-4 my-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Standards</label>
              <Select
                value={selectedStandardId}
                onValueChange={(val) => {
                  setSelectedStandardId(val === 'all' ? 'all' : val)
                  setPagination((prev) => ({
                    ...prev,
                    page: 1,
                  }))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select standard" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all" value="all">
                    All
                  </SelectItem>
                  {filterOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={pagedRows || []}
            pagination={pagination}
            paginationMeta={{
              totalCount: allRows.length,
              pageInfo: {
                hasNextPage: pagination.page * pagination.pageSize < allRows.length,
                hasPreviousPage: pagination.page > 1,
              },
              isLoading: isLoading,
            }}
            onPaginationChange={setPagination}
            loading={isLoading}
            tableKey={TableKeyEnum.CONTROLS_MAPPED_CATEGORIES}
          />

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="secondary"
              onClick={() => {
                setOpen(false)
                onClose()
              }}
            >
              Cancel
            </Button>
            <SaveButton onClick={handleSave} isSaving={isPending} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default MappedCategoriesDialog
