'use client'

import React from 'react'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { PlusCircle, SearchIcon, LoaderCircle } from 'lucide-react'
import { VisibilityState } from '@tanstack/react-table'
import ColumnVisibilityMenu from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { useRouter, useSearchParams } from 'next/navigation'
import { TableFilter } from '@/components/shared/table-filter/table-filter'
import { TableFilterKeysEnum } from '@/components/shared/table-filter/table-filter-keys'
import { TrustCenterDocWhereInput } from '@repo/codegen/src/schema'
import { trustCenterDocsFilterFields } from './table-config'

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
}

const DocumentsTableToolbar: React.FC<TProps> = ({ searching, searchTerm, setSearchTerm, columnVisibility, setColumnVisibility, mappedColumns, handleFilterChange }) => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleCreateClick = () => {
    const params = new URLSearchParams(searchParams)
    params.set('create', 'true')
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 my-3 w-full">
      {/* Left section - Search bar */}
      <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
        <Input
          icon={searching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.currentTarget.value)}
          variant="searchTable"
          className="w-[240px]"
        />
      </div>

      {/* Right section - actions */}
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {/* Column Visibility Menu */}
        {mappedColumns && columnVisibility && setColumnVisibility && (
          <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} />
        )}

        {/* Filter Button Placeholder */}
        <TableFilter filterFields={trustCenterDocsFilterFields} onFilterChange={handleFilterChange} pageKey={TableFilterKeysEnum.TRUST_CENTER_DOCS} />

        {/* Create Button */}
        <Button variant="primary" icon={<PlusCircle size={16} strokeWidth={2} />} iconPosition="left" onClick={handleCreateClick}>
          New Document
        </Button>
      </div>
    </div>
  )
}

export default DocumentsTableToolbar
