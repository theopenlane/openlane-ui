'use client'

import React, { useState } from 'react'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { ChevronDown, DownloadIcon, LoaderCircle, SearchIcon, Trash2 } from 'lucide-react'
import { VisibilityState } from '@tanstack/react-table'
import ColumnVisibilityMenu from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { TableFilter } from '@/components/shared/table-filter/table-filter'
import { CreateSubprocessorMutation, SubprocessorWhereInput } from '@repo/codegen/src/schema'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { TableKeyEnum } from '@repo/ui/table-key'
import { subprocessorsFilterFields } from './table-config'
import { useBulkDeleteTrustCenterSubprocessors } from '@/lib/graphql-hooks/trust-center-subprocessor'
import { useGetSubprocessors } from '@/lib/graphql-hooks/subprocessor'
import { CreateSubprocessorSheet } from '../sheet/create-subprocessor-sheet'
import { AddExistingDialog } from './add-existing-dialog'
import Menu from '@/components/shared/menu/menu'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'

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
  onExport: () => void
  exportEnabled: boolean
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
  exportEnabled,
  onExport,
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [createSheetOpen, setCreateSheetOpen] = useState(false)
  const [addExistingOpen, setAddExistingOpen] = useState(false)

  const { mutate: deleteRows, isPending: isDeleting } = useBulkDeleteTrustCenterSubprocessors()
  const [createdSubprocessor, setCreatedSubprocessor] = useState<null | CreateSubprocessorMutation['createSubprocessor']['subprocessor']>(null)
  const { subprocessors } = useGetSubprocessors({
    where: { or: [{ hasTrustCenterSubprocessors: false }] },
  })
  const hasAvailableSubprocessors = (subprocessors?.length ?? 0) > 0

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
            <Menu
              closeOnSelect={true}
              content={(close) => (
                <>
                  <Button
                    size="sm"
                    variant="transparent"
                    className={`px-1 flex items-center justify-start space-x-2 cursor-pointer ${!exportEnabled ? 'opacity-50' : ''}`}
                    onClick={() => {
                      onExport()
                      close()
                    }}
                  >
                    <DownloadIcon size={16} strokeWidth={2} />
                    <span>Export</span>
                  </Button>
                </>
              )}
            />
            {mappedColumns && columnVisibility && setColumnVisibility && (
              <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} storageKey={TableKeyEnum.TRUST_CENTER_SUBPROCESSORS} />
            )}

            <TableFilter filterFields={subprocessorsFilterFields} onFilterChange={handleFilterChange} pageKey={TableKeyEnum.TRUST_CENTER_SUBPROCESSORS} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="primary" className="h-8" icon={<ChevronDown size={16} />}>
                  Create
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {hasAvailableSubprocessors && <DropdownMenuItem onSelect={() => setAddExistingOpen(true)}>Add subprocessor</DropdownMenuItem>}
                <DropdownMenuItem onSelect={() => setCreateSheetOpen(true)}>Custom subprocessor</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <AddExistingDialog createdSubprocessor={createdSubprocessor} onClose={() => setCreatedSubprocessor(null)} open={addExistingOpen} onOpenChange={setAddExistingOpen} />
            <CreateSubprocessorSheet onCreateSuccess={setCreatedSubprocessor} open={createSheetOpen} onOpenChange={setCreateSheetOpen} />
          </div>
        ) : (
          <div className="flex items-center gap-2 justify-end flex-wrap">
            <Button variant="secondary" icon={<Trash2 size={16} />} iconPosition="left" onClick={handleBulkDelete} disabled={isDeleting}>
              Bulk Delete ({selectedRows.length})
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setSelectedRows([])
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </>
  )
}

export default SubprocessorsTableToolbar
