'use client'

import React, { useState } from 'react'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { LoaderCircle, SearchIcon, Trash2 } from 'lucide-react'
import { VisibilityState } from '@tanstack/react-table'
import ColumnVisibilityMenu from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { TableFilter } from '@/components/shared/table-filter/table-filter'
import { TableFilterKeysEnum } from '@/components/shared/table-filter/table-filter-keys'
import { SubprocessorWhereInput } from '@repo/codegen/src/schema'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { TableColumnVisibilityKeysEnum } from '@/components/shared/table-column-visibility/table-column-visibility-keys'
import { subprocessorsFilterFields } from './table-config'
import { useBulkDeleteTrustCenterSubprocessors } from '@/lib/graphql-hooks/trust-center-subprocessors'
import { CreateSubprocessorSheet } from '../sheet/create-subprocessor-sheet'
import { AddExistingDialog } from './add-existing-dialog'

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
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const { mutate: deleteRows, isPending: isDeleting } = useBulkDeleteTrustCenterSubprocessors()
  const [createdSubprocessorId, setCreatedSubprocessorId] = useState<null | string>(null)

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
        <div className="flex items-center gap-2 grow sm:grow-0`">
          <Input
            icon={searching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
            placeholder="Search subprocessors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
            variant="searchTable"
            className="w-60"
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
            <AddExistingDialog createdSubprocessorId={createdSubprocessorId} onClose={() => setCreatedSubprocessorId(null)} />
            <CreateSubprocessorSheet onCreateSuccess={setCreatedSubprocessorId} />
          </div>
        ) : (
          <div className="flex items-center gap-2 justify-end flex-wrap">
            <Button variant="secondary" icon={<Trash2 size={16} />} iconPosition="left" onClick={handleBulkDelete} disabled={isDeleting}>
              Bulk Delete ({selectedRows.length})
            </Button>
          </div>
        )}
      </div>
    </>
  )
}

export default SubprocessorsTableToolbar
