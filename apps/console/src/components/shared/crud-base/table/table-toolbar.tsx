'use client'

import React, { useState } from 'react'
import { DownloadIcon, LoaderCircle, PlusCircle, SearchIcon } from 'lucide-react'
import Menu from '@/components/shared/menu/menu'
import { VisibilityState } from '@tanstack/react-table'
import ColumnVisibilityMenu from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { Input } from '@repo/ui/input'
import { TAccessRole, TPermissionData } from '@/types/authz'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { Button } from '@repo/ui/button'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import { GenericBulkCSVCreateDialog } from '@/components/shared/crud-base/dialog/bulk-csv-create-dialog'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { TableKeyValue } from '@repo/ui/table-key'
import { TableFilter } from '../../table-filter/table-filter'
import { FilterField } from '@/types'

type GenericTableToolbarProps<T extends { id: string }> = {
  entityType: ObjectTypes
  handleExport: () => void
  filterFields?: FilterField[] | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onFilterChange?: (filters: any | null) => void
  columnVisibility?: VisibilityState
  setColumnVisibility?: React.Dispatch<React.SetStateAction<VisibilityState>>
  mappedColumns: {
    accessorKey: string
    header: string
  }[]
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  searching?: boolean
  canEdit: (accessRole: TAccessRole[] | undefined) => boolean
  permission: TPermissionData | undefined
  handleClearSelected: () => void
  selectedItems: T[]
  setSelectedItems: React.Dispatch<React.SetStateAction<T[]>>
  onBulkDelete: (ids: string[]) => Promise<void>
  onBulkCreate?: (file: File) => Promise<void>
  storageKey: TableKeyValue
  renderBulkEdit?: (props: { selectedItems: T[]; setSelectedItems: React.Dispatch<React.SetStateAction<T[]>> }) => React.ReactNode
}

function GenericTableToolbar<T extends { id: string }>(props: GenericTableToolbarProps<T>) {
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)

  const { successNotification, errorNotification } = useNotification()
  const { replace } = useSmartRouter()

  const entityLabel = props.entityType.charAt(0).toUpperCase() + props.entityType.slice(1).toLowerCase()
  const entityLabelPlural = `${entityLabel}s`

  const openCreateSheet = () => {
    replace({ create: 'true', id: null })
  }

  const handleBulkDelete = async () => {
    if (!props.selectedItems || props.selectedItems.length === 0) {
      errorNotification({
        title: `Missing ${entityLabelPlural.toLowerCase()}`,
        description: `${entityLabelPlural} not found.`,
      })
      return
    }

    try {
      await props.onBulkDelete(props.selectedItems.map((item) => item.id))
      successNotification({
        title: `Selected ${entityLabelPlural.toLowerCase()} have been successfully deleted.`,
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setIsBulkDeleteDialogOpen(false)
      props.setSelectedItems([])
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 my-2">
        <Input
          className="bg-transparent w-[280px]"
          icon={props.searching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
          placeholder="Search"
          value={props.searchTerm}
          onChange={(event) => props.setSearchTerm(event.currentTarget.value)}
          variant="searchTable"
          iconPosition="left"
        />
        <div className="grow flex flex-row items-center gap-2 justify-end">
          {props.selectedItems.length > 0 ? (
            <>
              {props.canEdit(props.permission?.roles) &&
                props.renderBulkEdit?.({
                  selectedItems: props.selectedItems,
                  setSelectedItems: props.setSelectedItems,
                })}
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsBulkDeleteDialogOpen(true)
                }}
              >
                {props.selectedItems && props.selectedItems.length > 0 ? `Bulk Delete (${props.selectedItems.length})` : 'Bulk Delete'}
              </Button>
              {props.canEdit(props.permission?.roles) && (
                <>
                  <ConfirmationDialog
                    open={isBulkDeleteDialogOpen}
                    onOpenChange={setIsBulkDeleteDialogOpen}
                    onConfirm={handleBulkDelete}
                    title={`Delete selected ${entityLabelPlural.toLowerCase()}?`}
                    description={<>This action cannot be undone. This will permanently delete selected {entityLabelPlural.toLowerCase()}.</>}
                    confirmationText="Delete"
                    confirmationTextVariant="destructive"
                    showInput={false}
                  />
                  <CancelButton
                    onClick={() => {
                      props.handleClearSelected()
                    }}
                  ></CancelButton>
                </>
              )}
            </>
          ) : (
            <>
              <Menu
                closeOnSelect={true}
                content={(close) => (
                  <>
                    {props.onBulkCreate && <GenericBulkCSVCreateDialog entityType={props.entityType} onBulkCreate={props.onBulkCreate} />}
                    <Button
                      size="sm"
                      variant="transparent"
                      className="px-1 flex items-center justify-start space-x-2 cursor-pointer"
                      onClick={() => {
                        props.handleExport()
                        close()
                      }}
                    >
                      <DownloadIcon size={16} strokeWidth={2} />
                      <span>Export</span>
                    </Button>
                  </>
                )}
              />

              {props.mappedColumns && props.columnVisibility && props.setColumnVisibility && (
                <ColumnVisibilityMenu mappedColumns={props.mappedColumns} columnVisibility={props.columnVisibility} setColumnVisibility={props.setColumnVisibility} storageKey={props.storageKey} />
              )}
              {props.filterFields && <TableFilter filterFields={props.filterFields} onFilterChange={props.onFilterChange} pageKey={props.storageKey} />}
              <Button icon={<PlusCircle />} iconPosition="left" onClick={openCreateSheet}>
                Create
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export { GenericTableToolbar }
