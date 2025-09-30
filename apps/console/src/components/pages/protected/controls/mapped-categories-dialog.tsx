'use client'

import React, { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { useFormContext } from 'react-hook-form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@repo/ui/table'
import { useGetStandards } from '@/lib/graphql-hooks/standards'
import { FolderIcon } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useUpdateControl } from '@/lib/graphql-hooks/controls'

const ROWS_PER_PAGE = 5

const MappedCategoriesDialog = ({ onClose }: { onClose: () => void }) => {
  const { id } = useParams<{ id: string }>()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [selectedStandardId, setSelectedStandardId] = useState<string | 'all'>('all')
  const [page, setPage] = useState(0)

  const { mutateAsync: updateControl, isPending } = useUpdateControl()

  const { setValue, getValues } = useFormContext()
  const { data } = useGetStandards({})

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
        standardLabel: standard?.shortName,
        domain,
      })),
    )
  }, [filteredStandards])

  const pagedRows = useMemo(() => {
    const start = page * ROWS_PER_PAGE
    return allRows.slice(start, start + ROWS_PER_PAGE)
  }, [allRows, page])

  const totalPages = Math.ceil(allRows.length / ROWS_PER_PAGE)

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

  const handlePageChange = (direction: 'prev' | 'next') => {
    setPage((p) => {
      if (direction === 'prev') return Math.max(0, p - 1)
      if (direction === 'next') return Math.min(totalPages - 1, p + 1)
      return p
    })
  }

  const filterOptions = useMemo(() => {
    return standards.map((standard) => ({
      label: standard?.shortName,
      value: standard?.id,
    }))
  }, [standards])

  const handleOpen = () => {
    setOpen(true)
    setPage(0)
    const initial = getValues('mappedCategories') || []
    setSelected(initial)
  }

  return (
    <>
      <div className="grid grid-cols-[140px_1fr] items-start gap-x-3 border-b border-border pb-3 last:border-b-0">
        <div className="flex items-start gap-2">
          <FolderIcon size={16} className="text-brand min-w-4 pt-0.5" />
          <div className="text-sm">Mapped categories</div>
        </div>
        <div className="text-sm">
          <Button className="h-8 !px-2 btn-secondary" onClick={handleOpen} type="button">
            Set mappings
          </Button>
        </div>
      </div>

      <Dialog
        open={open}
        onOpenChange={(val) => {
          setOpen(val)
          setPage(0)
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
              <Select value={selectedStandardId} onValueChange={(val) => setSelectedStandardId(val as string | 'all')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select standard" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {filterOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value || ''}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Standards</TableHead>
                  <TableHead>Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Checkbox checked={selected.includes(row.domain)} onCheckedChange={() => toggle(row.domain)} />
                    </TableCell>
                    <TableCell>{row.standardLabel}</TableCell>
                    <TableCell>{row.domain}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <Button size="sm" onClick={() => handlePageChange('prev')} disabled={page === 0}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <Button size="sm" onClick={() => handlePageChange('next')} disabled={page + 1 >= totalPages}>
              Next
            </Button>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-6">
            <Button
              className="h-8 !px-2"
              onClick={() => {
                setOpen(false)
                onClose()
              }}
            >
              Cancel
            </Button>
            <Button className="h-8 !px-2" onClick={handleSave}>
              {isPending ? 'Saving...' : `Save(${selected.length})`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default MappedCategoriesDialog
