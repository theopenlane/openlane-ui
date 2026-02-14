import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React, { useEffect, useState } from 'react'
import { DownloadIcon, LoaderCircle, SearchIcon, SquarePlus, Upload } from 'lucide-react'
import { Input } from '@repo/ui/input'
import { getRisksFilterFields } from './table-config'
import { FilterField } from '@/types'
import { useProgramSelect } from '@/lib/graphql-hooks/program'
import Menu from '@/components/shared/menu/menu.tsx'
import BulkCSVCreateRiskDialog from '@/components/pages/protected/risks/bulk-csv-create-risk-dialog.tsx'
import { VisibilityState } from '@tanstack/react-table'
import ColumnVisibilityMenu from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { canCreate } from '@/lib/authz/utils.ts'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'
import { TAccessRole, TPermissionData } from '@/types/authz'
import { RiskWhereInput } from '@repo/codegen/src/schema'
import { BulkEditRisksDialog } from '../bulk-edit/bulk-edit-risks'
import { Button } from '@repo/ui/button'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useBulkDeleteRisks } from '@/lib/graphql-hooks/risk'
import { TableKeyEnum } from '@repo/ui/table-key'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

type TProps = {
  onFilterChange: (filters: RiskWhereInput) => void
  searching?: boolean
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  handleExport: () => void
  handleCreateNew: () => void
  columnVisibility?: VisibilityState
  setColumnVisibility?: React.Dispatch<React.SetStateAction<VisibilityState>>
  mappedColumns: {
    accessorKey: string
    header: string
  }[]
  exportEnabled: boolean
  handleClearSelectedControls: () => void
  selectedRisks: { id: string }[]
  setSelectedRisks: React.Dispatch<React.SetStateAction<{ id: string }[]>>
  canEdit: (accessRole: TAccessRole[] | undefined) => boolean
  permission: TPermissionData | undefined
}

const RisksTableToolbar: React.FC<TProps> = ({
  onFilterChange,
  searching,
  searchTerm,
  setSearchTerm,
  handleExport,
  columnVisibility,
  setColumnVisibility,
  mappedColumns,
  handleCreateNew,
  exportEnabled,
  handleClearSelectedControls,
  selectedRisks,
  setSelectedRisks,
  canEdit,
  permission,
}: TProps) => {
  const { programOptions, isSuccess: isProgramsSuccess } = useProgramSelect({})
  const [filterFields, setFilterFields] = useState<FilterField[] | undefined>(undefined)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: bulkDeleteRisks } = useBulkDeleteRisks()

  const { enumOptions: riskKindOptions, isSuccess: isTypeSuccess } = useGetCustomTypeEnums({
    where: {
      objectType: 'risk',
      field: 'kind',
    },
  })

  const { enumOptions: riskCategoryOptions, isSuccess: isCategorySuccess } = useGetCustomTypeEnums({
    where: {
      objectType: 'risk',
      field: 'category',
    },
  })

  useEffect(() => {
    if (!isProgramsSuccess || !isTypeSuccess || !isCategorySuccess) return
    if (filterFields) return

    const fields = getRisksFilterFields(programOptions, riskKindOptions ?? [], riskCategoryOptions ?? [])

    setFilterFields(fields)
  }, [filterFields, programOptions, riskKindOptions, riskCategoryOptions, isProgramsSuccess, isTypeSuccess, isCategorySuccess])

  const handleBulkDelete = async () => {
    if (!selectedRisks) {
      errorNotification({
        title: 'Missing risks',
        description: 'Risks not found.',
      })
      return
    }
    try {
      await bulkDeleteRisks({ ids: selectedRisks.map((risk) => risk.id) })
      successNotification({
        title: 'Selected risks have been successfully deleted.',
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setIsBulkDeleteDialogOpen(false)
      setSelectedRisks([])
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 my-2">
        <div className="grow flex flex-row items-center gap-2">
          <Input
            icon={searching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
            placeholder="Search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.currentTarget.value)}
            variant="searchTable"
          />
        </div>
        {selectedRisks.length > 0 ? (
          <>
            {canEdit(permission?.roles) && <BulkEditRisksDialog selectedRisks={selectedRisks} setSelectedRisks={setSelectedRisks}></BulkEditRisksDialog>}
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsBulkDeleteDialogOpen(true)
              }}
            >
              {selectedRisks && selectedRisks.length > 0 ? `Bulk Delete (${selectedRisks.length})` : 'Bulk Delete'}
            </Button>
            {canEdit(permission?.roles) && (
              <>
                <ConfirmationDialog
                  open={isBulkDeleteDialogOpen}
                  onOpenChange={setIsBulkDeleteDialogOpen}
                  onConfirm={handleBulkDelete}
                  title={`Delete selected risks?`}
                  description={<>This action cannot be undone. This will permanently delete selected risks.</>}
                  confirmationText="Delete"
                  confirmationTextVariant="destructive"
                  showInput={false}
                />
                <CancelButton
                  onClick={() => {
                    handleClearSelectedControls()
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
                  {canCreate(permission?.roles, AccessEnum.CanCreateRisk) && (
                    <BulkCSVCreateRiskDialog
                      trigger={
                        <div className="flex items-center space-x-2 px-1">
                          <Upload size={16} strokeWidth={2} />
                          <span>Bulk Upload</span>
                        </div>
                      }
                    />
                  )}
                  <button
                    className={`px-1 bg-transparent flex items-center space-x-2 cursor-pointer ${!exportEnabled ? 'opacity-50' : ''}`}
                    onClick={() => {
                      handleExport()
                      close()
                    }}
                  >
                    <DownloadIcon size={16} strokeWidth={2} />
                    <span>Export</span>
                  </button>
                </>
              )}
            />
            {mappedColumns && columnVisibility && setColumnVisibility && (
              <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} storageKey={TableKeyEnum.RISK} />
            )}
            {filterFields && <TableFilter filterFields={filterFields} onFilterChange={onFilterChange} pageKey={TableKeyEnum.RISK} />}
            {canCreate(permission?.roles, AccessEnum.CanCreateRisk) && (
              <Button variant="primary" onClick={handleCreateNew} className="h-8 px-2! pl-3!" icon={<SquarePlus />} iconPosition="left">
                Create
              </Button>
            )}
          </>
        )}
      </div>
    </>
  )
}

export default RisksTableToolbar
