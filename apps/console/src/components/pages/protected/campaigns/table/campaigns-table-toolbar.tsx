import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React, { useMemo, useState } from 'react'
import { getCampaignFilterFields } from '@/components/pages/protected/campaigns/table/table-config'
import { type FilterField } from '@/types'
import { DownloadIcon, LoaderCircle, SearchIcon, SquarePlus } from 'lucide-react'
import Menu from '@/components/shared/menu/menu'
import { type VisibilityState } from '@tanstack/react-table'
import ColumnVisibilityMenu from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { Input } from '@repo/ui/input'
import { type CampaignWhereInput } from '@repo/codegen/src/schema'
import { Button } from '@repo/ui/button'
import { type TAccessRole, type TPermissionData } from '@/types/authz'
import { useNotification } from '@/hooks/useNotification'
import { useDeleteCampaign } from '@/lib/graphql-hooks/campaign'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { TableKeyEnum } from '@repo/ui/table-key'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

type TCampaignTableToolbarProps = {
  onFilterChange: (filters: CampaignWhereInput) => void
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
  permission: TPermissionData | undefined
  handleClearSelectedCampaigns: () => void
  selectedCampaigns: { id: string }[]
  setSelectedCampaigns: React.Dispatch<React.SetStateAction<{ id: string }[]>>
  onCreateCampaign?: () => void
}

const CampaignTableToolbar: React.FC<TCampaignTableToolbarProps> = (props) => {
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: deleteCampaign } = useDeleteCampaign()
  const filterFields: FilterField[] = useMemo(() => getCampaignFilterFields(), [])

  const handleBulkDelete = async () => {
    if (!props.selectedCampaigns || props.selectedCampaigns.length === 0) {
      errorNotification({
        title: 'Missing campaigns',
        description: 'Campaigns not found.',
      })
      return
    }

    try {
      await Promise.all(props.selectedCampaigns.map((campaign) => deleteCampaign({ deleteCampaignId: campaign.id })))
      successNotification({
        title: 'Selected campaigns have been successfully deleted.',
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setIsBulkDeleteDialogOpen(false)
      props.setSelectedCampaigns([])
    }
  }

  return (
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
        {props.selectedCampaigns.length > 0 ? (
          <>
            {props.canEdit(props.permission?.roles) && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsBulkDeleteDialogOpen(true)
                  }}
                >
                  Bulk Delete ({props.selectedCampaigns.length})
                </Button>
                <ConfirmationDialog
                  open={isBulkDeleteDialogOpen}
                  onOpenChange={setIsBulkDeleteDialogOpen}
                  onConfirm={handleBulkDelete}
                  title="Delete selected campaigns?"
                  description={<>This action cannot be undone. This will permanently delete selected campaigns.</>}
                  confirmationText="Delete"
                  confirmationTextVariant="destructive"
                  showInput={false}
                />
              </>
            )}
            <CancelButton
              onClick={() => {
                props.handleClearSelectedCampaigns()
              }}
            />
          </>
        ) : (
          <>
            <Menu
              content={
                <button className={`px-1 bg-transparent flex items-center space-x-2 cursor-pointer ${!props.exportEnabled ? 'opacity-50' : ''}`} onClick={props.handleExport}>
                  <DownloadIcon size={16} strokeWidth={2} />
                  <span>Export</span>
                </button>
              }
            />
            {props.mappedColumns && props.columnVisibility && props.setColumnVisibility && (
              <ColumnVisibilityMenu mappedColumns={props.mappedColumns} columnVisibility={props.columnVisibility} setColumnVisibility={props.setColumnVisibility} storageKey={TableKeyEnum.CAMPAIGN} />
            )}
            <TableFilter filterFields={filterFields} onFilterChange={props.onFilterChange} pageKey={TableKeyEnum.CAMPAIGN} />
            {props.onCreateCampaign && (
              <Button variant="primary" icon={<SquarePlus size={16} />} iconPosition="left" onClick={props.onCreateCampaign}>
                Create Campaign
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default CampaignTableToolbar
