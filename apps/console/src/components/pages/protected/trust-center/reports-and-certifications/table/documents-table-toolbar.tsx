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
import { TrustCenterDocWhereInput } from '@repo/codegen/src/schema'
import { trustCenterDocsFilterFields } from './table-config'
import { useBulkDeleteTrustCenterDocs, useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { BulkEditTrustCenterDocsDialog } from './bulk-edit-trust-center-dialog'
import { TableColumnVisibilityKeysEnum } from '@/components/shared/table-column-visibility/table-column-visibility-keys.ts'
import ApplyWatermarkSheet from './apply-watermark-sheet'

type TProps = {
  searching?: boolean
  searchTerm: string
  setSearchTerm: (val: string) => void
  columnVisibility?: VisibilityState
  setColumnVisibility?: React.Dispatch<React.SetStateAction<VisibilityState>>
  mappedColumns: {
    accessorKey: string
    header: string
  }[]
  handleFilterChange: (arg: TrustCenterDocWhereInput) => void
  selectedDocs: { id: string }[]
  setSelectedDocs: React.Dispatch<React.SetStateAction<{ id: string }[]>>
}

const DocumentsTableToolbar: React.FC<TProps> = ({ searching, searchTerm, setSearchTerm, columnVisibility, setColumnVisibility, mappedColumns, handleFilterChange, selectedDocs, setSelectedDocs }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data } = useGetTrustCenter()
  const { mutate: deleteDocs, isPending: isDeleting } = useBulkDeleteTrustCenterDocs()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const handleCreateClick = () => {
    const params = new URLSearchParams(searchParams)
    params.set('create', 'true')
    router.push(`?${params.toString()}`)
  }

  const trustCenter = data?.trustCenters?.edges?.[0]?.node
  const watermarkConfig = trustCenter?.watermarkConfig

  const handleBulkDelete = () => {
    if (selectedDocs.length === 0) return
    setIsConfirmOpen(true)
  }

  const confirmBulkDelete = () => {
    const ids = selectedDocs.map((d) => d.id)
    deleteDocs(
      { ids },
      {
        onSuccess: () => {
          setSelectedDocs([])
          setIsConfirmOpen(false)
        },
        onError: (err) => {
          console.error('Bulk delete failed:', err)
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
        title="Delete selected documents?"
        description={
          <>
            You are about to permanently delete <b>{selectedDocs.length}</b> document
            {selectedDocs.length > 1 ? 's' : ''}. <br />
            This action cannot be undone.
          </>
        }
        confirmationText={isDeleting ? 'Deleting...' : 'Delete'}
        confirmationTextVariant="destructive"
      />

      <div className="flex flex-wrap items-center justify-between gap-2 my-3 w-full">
        <div className="flex items-center gap-2 grow sm:grow-0">
          <Input
            icon={searching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
            variant="searchTable"
            className="w-60"
          />
        </div>
        {selectedDocs.length === 0 ? (
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {mappedColumns && columnVisibility && setColumnVisibility && (
              <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} storageKey={TableColumnVisibilityKeysEnum.DOCUMENTS} />
            )}
            {watermarkConfig && <ApplyWatermarkSheet watermarkConfig={watermarkConfig} />}
            <TableFilter filterFields={trustCenterDocsFilterFields} onFilterChange={handleFilterChange} pageKey={TableFilterKeysEnum.TRUST_CENTER_DOCS} />
            <Button variant="primary" icon={<PlusCircle size={16} strokeWidth={2} />} iconPosition="left" onClick={handleCreateClick}>
              New Document
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 justify-end flex-wrap">
            <Button variant="secondary" icon={<Trash2 size={16} />} iconPosition="left" onClick={handleBulkDelete} disabled={isDeleting}>
              Bulk Delete ({selectedDocs.length})
            </Button>
            <BulkEditTrustCenterDocsDialog selectedDocs={selectedDocs} setSelectedDocs={setSelectedDocs} />
          </div>
        )}
      </div>
    </>
  )
}

export default DocumentsTableToolbar
