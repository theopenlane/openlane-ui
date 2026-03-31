'use client'

import React, { useState } from 'react'
import { type ZodObject, type ZodRawShape } from 'zod'
import { DownloadIcon, LoaderCircle, PlusCircle, SearchIcon } from 'lucide-react'
import Menu from '@/components/shared/menu/menu'
import { type VisibilityState } from '@tanstack/react-table'
import ColumnVisibilityMenu from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { Input } from '@repo/ui/input'
import { type TAccessRole, type TPermissionData } from '@/types/authz'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { Button } from '@repo/ui/button'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import { useRouter } from 'next/navigation'
import { GenericBulkCSVCreateDialog } from '@/components/shared/crud-base/dialog/bulk-csv-create-dialog'
import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { type TableKeyValue } from '@repo/ui/table-key'
import { TableFilter } from '../../table-filter/table-filter'
import { type FilterField } from '@/types'
import type { WhereCondition } from '@/types'
import { GenericBulkEditDialog, type ResponsibilityFieldsMap } from '../dialog/bulk-edit'
import { type EnumOptionsGeneric } from '../page'
import type { CreateMode } from '../types'

type GenericTableToolbarProps<T extends { id: string }, TWhereInput, TUpdateInput> = {
  entityType: ObjectTypes
  displayName?: string
  handleExport: () => void
  filterFields?: FilterField[] | undefined
  onFilterChange?: (filters: TWhereInput | null) => void
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
  onBulkDelete?: (ids: string[]) => Promise<void>
  onBulkCreate?: (file: File) => Promise<void>
  onBulkEdit?: (ids: string[], data: TUpdateInput) => Promise<void>
  bulkEditFormSchema?: ZodObject<ZodRawShape>
  storageKey: TableKeyValue
  enumOpts?: EnumOptionsGeneric
  responsibilityFields?: ResponsibilityFieldsMap
  createMode?: CreateMode
}

function GenericTableToolbar<T extends { id: string }, TWhereInput, TUpdateInput>(props: GenericTableToolbarProps<T, TWhereInput, TUpdateInput>) {
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false)

  const { successNotification, errorNotification } = useNotification()
  const { replace } = useSmartRouter()
  const router = useRouter()

  const entityLabel = props.displayName ?? props.entityType.charAt(0).toUpperCase() + props.entityType.slice(1).toLowerCase()
  const entityLabelPlural = `${entityLabel}s`

  const openCreateSheet = () => {
    if (props.createMode?.type === 'full-page') {
      router.push(props.createMode.route)
      return
    }
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
      await props.onBulkDelete?.(props.selectedItems.map((item) => item.id))
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
              {props.canEdit(props.permission?.roles) && props.onBulkEdit && props.bulkEditFormSchema && (
                <>
                  <GenericBulkEditDialog<T, TUpdateInput>
                    open={isBulkEditDialogOpen}
                    onOpenChange={setIsBulkEditDialogOpen}
                    selectedItems={props.selectedItems}
                    setSelectedItems={props.setSelectedItems}
                    schema={props.bulkEditFormSchema as ZodObject<ZodRawShape>}
                    bulkEditMutation={{
                      mutateAsync: async ({ ids, input }) => {
                        await props.onBulkEdit?.(ids, input as TUpdateInput)
                      },
                    }}
                    enumOpts={props.enumOpts}
                    entityType={props.entityType}
                    displayName={props.displayName}
                    responsibilityFields={props.responsibilityFields}
                  />
                </>
              )}
              {props.canEdit(props.permission?.roles) && props.onBulkDelete && (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setIsBulkDeleteDialogOpen(true)
                    }}
                  >
                    {props.selectedItems && props.selectedItems.length > 0 ? `Bulk Delete (${props.selectedItems.length})` : 'Bulk Delete'}
                  </Button>
                </>
              )}
              {props.canEdit(props.permission?.roles) && props.onBulkDelete && (
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
                    {props.onBulkCreate && <GenericBulkCSVCreateDialog entityType={props.entityType} displayName={props.displayName} onBulkCreate={props.onBulkCreate} />}
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
              {props.filterFields && <TableFilter filterFields={props.filterFields} onFilterChange={props.onFilterChange as (whereCondition: WhereCondition) => void} pageKey={props.storageKey} />}
              {props.canEdit(props.permission?.roles) && (
                <Button icon={<PlusCircle />} iconPosition="left" onClick={openCreateSheet}>
                  Create
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

export { GenericTableToolbar }
