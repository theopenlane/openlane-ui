'use client'

import React, { useState } from 'react'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { LoaderCircle, PlusCircle, SearchIcon, Trash2 } from 'lucide-react'
import { VisibilityState } from '@tanstack/react-table'
import ColumnVisibilityMenu from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { useRouter, useSearchParams } from 'next/navigation'
import { TableFilter } from '@/components/shared/table-filter/table-filter'
import { TableFilterKeysEnum } from '@/components/shared/table-filter/table-filter-keys'
import { SubprocessorWhereInput } from '@repo/codegen/src/schema'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { TableColumnVisibilityKeysEnum } from '@/components/shared/table-column-visibility/table-column-visibility-keys'
import { useBulkDeleteSubprocessors } from '@/lib/graphql-hooks/trust-center-subprocessors'
import { subprocessorsFilterFields } from './table-config'

type TProps = {
  searching?: boolean
  searchTerm: string
  setSearchTerm: (val: string) => void
  columnVisibility?: VisibilityState
  setColumnVisibility?: React.Dispatch<React.SetStateAction<VisibilityState>>
  mappedColumns: { accessorKey: string; header: string }[]
  handleFilterChange: (arg: SubprocessorWhereInput) => void
  selectedRows: { id: string }[]
  setSelectedRows: React.Dispatch<React.SetStateAction<{ id: string }[]>>
}

const SubprocessorsTableToolbar: React.FC<TProps> = ({
  searching,
  searchTerm,
  setSearchTerm,
  columnVisibility,
  setColumnVisibility,
  mappedColumns,
  handleFilterChange,
  selectedRows,
  setSelectedRows,
}) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const { mutate: deleteRows, isPending: isDeleting } = useBulkDeleteSubprocessors()

  const handleCreateClick = () => {
    const params = new URLSearchParams(searchParams)
    params.set('create', 'true')
    router.push(`?${params.toString()}`)
  }

  const handleBulkDelete = () => {
    if (selectedRows.length === 0) return
    setIsConfirmOpen(true)
  }

  const confirmBulkDelete = () => {
    const ids = selectedRows.map((d) => d.id)
    deleteRows(
      { ids },
      {
        onSuccess: () => {
          setSelectedRows([])
          setIsConfirmOpen(false)
        },
        onError: () => {
          setIsConfirmOpen(false)
        },
      },
    )
  }

  return (
    <>
      <ConfirmationDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={confirmBulkDelete}
        title="Delete selected subprocessors?"
        description={
          <>
            You are about to permanently delete <b>{selectedRows.length}</b> subprocessors.
            <br />
            This action cannot be undone.
          </>
        }
        confirmationText={isDeleting ? 'Deleting...' : 'Delete'}
        confirmationTextVariant="destructive"
      />

      <div className="flex flex-wrap items-center justify-between gap-2 my-3 w-full">
        <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
          <Input
            icon={searching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
            placeholder="Search subprocessors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
            variant="searchTable"
            className="w-[240px]"
          />
        </div>

        {selectedRows.length === 0 ? (
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {mappedColumns && columnVisibility && setColumnVisibility && (
              <ColumnVisibilityMenu
                mappedColumns={mappedColumns}
                columnVisibility={columnVisibility}
                setColumnVisibility={setColumnVisibility}
                storageKey={TableColumnVisibilityKeysEnum.SUBPROCESSORS}
              />
            )}

            <TableFilter filterFields={subprocessorsFilterFields} onFilterChange={handleFilterChange} pageKey={TableFilterKeysEnum.SUBPROCESSORS} />

            <Button variant="primary" icon={<PlusCircle size={16} />} iconPosition="left" onClick={handleCreateClick}>
              New Subprocessor
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 justify-end flex-wrap">
            <Button variant="secondary" icon={<Trash2 size={16} />} iconPosition="left" onClick={handleBulkDelete} disabled={isDeleting}>
              Bulk Delete ({selectedRows.length})
            </Button>

            {/* <BulkEditSubprocessorsDialog selectedRows={selectedRows} setSelectedRows={setSelectedRows} /> */}
          </div>
        )}
      </div>
    </>
  )
}

export default SubprocessorsTableToolbar
