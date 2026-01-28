import React, { useState } from 'react'
import { FilterField } from '@/types'
import { DownloadIcon, LoaderCircle, SearchIcon, Upload } from 'lucide-react'
import Menu from '@/components/shared/menu/menu'
import { VisibilityState } from '@tanstack/react-table'
import ColumnVisibilityMenu from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { Input } from '@repo/ui/input'
import { AssetWhereInput } from '@repo/codegen/src/schema'
import { TAccessRole, TData } from '@/types/authz'
import { useSession } from 'next-auth/react'
import { useNotification } from '@/hooks/useNotification'
import { useBulkDeleteAsset } from '@/lib/graphql-hooks/assets'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { TableColumnVisibilityKeysEnum } from '@/components/shared/table-column-visibility/table-column-visibility-keys.ts'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useAssetStore } from '../hooks/useStore'
import { CreateDialog } from '../create/dialog/create-dialog'

type TAssetTableToolbarProps = {
  onFilterChange: (filters: AssetWhereInput) => void
  handleExport: () => void
  columnVisibility?: VisibilityState
  setColumnVisibility?: React.Dispatch<React.SetStateAction<VisibilityState>>
  mappedColumns: {
    accessorKey: string
    header: string
  }[]
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  searching?: boolean
  exportEnabled: boolean
  canEdit: (accessRole: TAccessRole[] | undefined) => boolean
  permission: TData | undefined
  handleClearSelectedAssets: () => void
  selectedAssets: { id: string }[]
  setSelectedAssets: React.Dispatch<React.SetStateAction<{ id: string }[]>>
}

const AssetTableToolbar: React.FC<TAssetTableToolbarProps> = (props: TAssetTableToolbarProps) => {
  const { data: session } = useSession()
  const { orgMembers } = useAssetStore()
  const [filterFields, setFilterFields] = useState<FilterField[] | undefined>(undefined)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: bulkDeleteAssets } = useBulkDeleteAsset()

  const handleBulkDelete = async () => {
    if (!props.selectedAssets) {
      errorNotification({
        title: 'Missing assets',
        description: 'Assets not found.',
      })
      return
    }

    try {
      await bulkDeleteAssets({ ids: props.selectedAssets.map((asset) => asset.id) })
      successNotification({
        title: 'Selected assets have been successfully deleted.',
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setIsBulkDeleteDialogOpen(false)
      props.setSelectedAssets([])
    }
  }

  console.log('permission roles in toolbar:', props.permission?.roles)

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
          {props.selectedAssets.length > 0 ? (
            <>
              {/* {props.canEdit(props.permission?.roles) && <BulkEditAssetsDialog selectedAssets={props.selectedAssets} setSelectedAssets={props.setSelectedAssets}></BulkEditAssetsDialog>}
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsBulkDeleteDialogOpen(true)
                }}
              >
                {props.selectedAssets && props.selectedAssets.length > 0 ? `Bulk Delete (${props.selectedAssets.length})` : 'Bulk Delete'}
              </Button> */}
              {props.canEdit(props.permission?.roles) && (
                <>
                  <ConfirmationDialog
                    open={isBulkDeleteDialogOpen}
                    onOpenChange={setIsBulkDeleteDialogOpen}
                    onConfirm={handleBulkDelete}
                    title={`Delete selected assets?`}
                    description={<>This action cannot be undone. This will permanently delete selected assets.</>}
                    confirmationText="Delete"
                    confirmationTextVariant="destructive"
                    showInput={false}
                  />
                  <CancelButton
                    onClick={() => {
                      props.handleClearSelectedAssets()
                    }}
                  ></CancelButton>
                </>
              )}
            </>
          ) : (
            <>
              <Menu
                content={
                  <>
                    {/* <BulkCSVCreateAssetDialog
                      trigger={
                        <div className="flex items-center space-x-2 px-1">
                          <Upload size={16} strokeWidth={2} />
                          <span>Bulk Upload</span>
                        </div>
                      }
                    /> */}
                    <button className={`px-1 bg-transparent flex items-center space-x-2 cursor-pointer ${!props.exportEnabled ? 'opacity-50' : ''}`} onClick={props.handleExport}>
                      <DownloadIcon size={16} strokeWidth={2} />
                      <span>Export</span>
                    </button>
                  </>
                }
              />
              {props.mappedColumns && props.columnVisibility && props.setColumnVisibility && (
                <ColumnVisibilityMenu
                  mappedColumns={props.mappedColumns}
                  columnVisibility={props.columnVisibility}
                  setColumnVisibility={props.setColumnVisibility}
                  storageKey={TableColumnVisibilityKeysEnum.ASSET}
                />
              )}
              <CreateDialog />
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default AssetTableToolbar
