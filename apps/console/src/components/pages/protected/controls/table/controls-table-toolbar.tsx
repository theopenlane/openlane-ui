import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React, { useEffect, useMemo, useState } from 'react'
import { FilterField } from '@/types'
import { CirclePlus, DownloadIcon, LoaderCircle, SearchIcon, Upload } from 'lucide-react'
import { getControlsFilterFields } from './table-config'
import { Input } from '@repo/ui/input'
import { useProgramSelect } from '@/lib/graphql-hooks/program'
import Menu from '@/components/shared/menu/menu.tsx'
import { BulkCSVCreateControlDialog } from '@/components/pages/protected/controls/bulk-csv-create-control-dialog.tsx'
import { CreateBtn } from '@/components/shared/enum-mapper/common-enum'
import Link from 'next/link'
import { VisibilityState } from '@tanstack/react-table'
import ColumnVisibilityMenu from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { useGroupSelect } from '@/lib/graphql-hooks/group'
import { ControlWhereInput } from '@repo/codegen/src/schema'
import { useStandardsSelect } from '@/lib/graphql-hooks/standard'
import { Button } from '@repo/ui/button'
import { BulkEditControlsDialog } from '../bulk-edit/bulk-edit-controls'
import { canCreate } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { BulkCSVCloneControlDialog } from '../bulk-csv-clone-control-dialog'
import { TAccessRole, TPermissionData } from '@/types/authz'
import { BulkCSVCreateMappedControlDialog } from '../bulk-csv-create-map-control-dialog'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useBulkDeleteControls } from '@/lib/graphql-hooks/control'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { useOrganization } from '@/hooks/useOrganization'
import { BulkCSVUpdateControlDialog } from '../bulk-csv-update-control-dialog'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useGetTags } from '@/lib/graphql-hooks/tags'
import { TableKeyEnum } from '@repo/ui/table-key'

type TProps = {
  onFilterChange: (filters: ControlWhereInput) => void
  owners?: { value: string; label: string }[]
  searching?: boolean
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  handleExport: () => void
  columnVisibility?: VisibilityState
  setColumnVisibility?: React.Dispatch<React.SetStateAction<VisibilityState>>
  mappedColumns: {
    accessorKey: string
    header: string
  }[]
  exportEnabled: boolean
  handleClearSelectedControls: () => void
  selectedControls: { id: string; refCode: string }[]
  setSelectedControls: React.Dispatch<React.SetStateAction<{ id: string; refCode: string }[]>>
  canEdit: (accessRole: TAccessRole[] | undefined) => boolean
  permission: TPermissionData | undefined
}

const ControlsTableToolbar: React.FC<TProps> = ({
  onFilterChange,
  searching,
  searchTerm,
  setSearchTerm,
  handleExport,
  columnVisibility,
  setColumnVisibility,
  mappedColumns,
  exportEnabled,
  handleClearSelectedControls,
  selectedControls,
  setSelectedControls,
  canEdit,
  permission,
}: TProps) => {
  const { programOptions, isSuccess: isProgramSuccess } = useProgramSelect({})
  const { groupOptions, isSuccess: isGroupSuccess } = useGroupSelect()
  const groups = useMemo(() => groupOptions || [], [groupOptions])
  const [filterFields, setFilterFields] = useState<FilterField[] | undefined>(undefined)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const { currentOrgId } = useOrganization()

  const { standardOptions, isSuccess: isStandardSuccess } = useStandardsSelect({
    where: {
      hasControlsWith: [
        {
          hasOwnerWith: [
            {
              id: currentOrgId,
            },
          ],
        },
      ],
    },
  })

  const { successNotification, errorNotification } = useNotification()
  const createControlAllowed = canCreate(permission?.roles, AccessEnum.CanCreateControl)
  const createSubcontrolAllowed = canCreate(permission?.roles, AccessEnum.CanCreateSubcontrol)
  const { mutateAsync: bulkDeleteControls } = useBulkDeleteControls()
  const { enumOptions, isSuccess: isTypesSuccess } = useGetCustomTypeEnums({
    where: {
      objectType: 'control',
      field: 'kind',
    },
  })
  const { tagOptions: rawTagOptions } = useGetTags()
  const tagOptions = useMemo(() => rawTagOptions ?? [], [rawTagOptions])
  useEffect(() => {
    if (filterFields || !isProgramSuccess || !isGroupSuccess || !isStandardSuccess || !isTypesSuccess) {
      return
    }
    const fields = getControlsFilterFields(standardOptions, groups, programOptions, enumOptions, tagOptions)
    setFilterFields(fields)
  }, [groups, programOptions, filterFields, isGroupSuccess, isProgramSuccess, standardOptions, isStandardSuccess, enumOptions, isTypesSuccess, tagOptions])

  const handleBulkDelete = async () => {
    if (!selectedControls) {
      errorNotification({
        title: 'Missing controls',
        description: 'Controls not found.',
      })
      return
    }

    try {
      await bulkDeleteControls({ ids: selectedControls.map((control) => control.id) })
      successNotification({
        title: 'Selected controls have been successfully deleted.',
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setIsBulkDeleteDialogOpen(false)
      setSelectedControls([])
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

        <div className="grow flex flex-row items-center gap-2 justify-end">
          {selectedControls.length > 0 ? (
            <>
              {canEdit(permission?.roles) && <BulkEditControlsDialog selectedControls={selectedControls} setSelectedControls={setSelectedControls}></BulkEditControlsDialog>}
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsBulkDeleteDialogOpen(true)
                }}
              >
                {selectedControls && selectedControls.length > 0 ? `Bulk Delete (${selectedControls.length})` : 'Bulk Delete'}
              </Button>
              {canEdit(permission?.roles) && (
                <>
                  <ConfirmationDialog
                    open={isBulkDeleteDialogOpen}
                    onOpenChange={setIsBulkDeleteDialogOpen}
                    onConfirm={handleBulkDelete}
                    title={`Delete selected controls?`}
                    description={<>This action cannot be undone. This will permanently delete selected controls.</>}
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
                    <BulkCSVCloneControlDialog
                      trigger={
                        <Button size="sm" variant="transparent" className="flex items-center space-x-2 px-1">
                          <Upload size={16} strokeWidth={2} />
                          <span>Upload From Standard</span>
                        </Button>
                      }
                    />
                    <BulkCSVCreateControlDialog
                      trigger={
                        <Button size="sm" variant="transparent" className="flex items-center space-x-2 px-1">
                          <Upload size={16} strokeWidth={2} />
                          <span>Upload Custom Controls</span>
                        </Button>
                      }
                    />
                    <BulkCSVCreateMappedControlDialog
                      trigger={
                        <Button size="sm" variant="transparent" className="flex items-center space-x-2 px-1">
                          <Upload size={16} strokeWidth={2} />
                          <span>Upload Control Mappings</span>
                        </Button>
                      }
                    />
                    <BulkCSVUpdateControlDialog
                      trigger={
                        <Button size="sm" variant="transparent" className="flex items-center space-x-2 px-1">
                          <Upload size={16} strokeWidth={2} />
                          <span>Update Existing Controls</span>
                        </Button>
                      }
                    />
                    <Button
                      size="sm"
                      variant="transparent"
                      className={`px-1 flex items-center justify-start space-x-2 cursor-pointer ${!exportEnabled ? 'opacity-50' : ''}`}
                      onClick={() => {
                        handleExport()
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
                <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} storageKey={TableKeyEnum.CONTROL} />
              )}
              {filterFields && <TableFilter filterFields={filterFields} onFilterChange={onFilterChange} pageKey={TableKeyEnum.CONTROL} />}
              {(createControlAllowed || createSubcontrolAllowed) && (
                <Menu
                  trigger={CreateBtn}
                  content={
                    <>
                      {createControlAllowed && (
                        <Link href="/controls/create-control">
                          <div className="flex items-center space-x-2 ">
                            <CirclePlus size={16} strokeWidth={2} />
                            <span>Control</span>
                          </div>
                        </Link>
                      )}
                      {createSubcontrolAllowed && (
                        <Link href="/controls/create-subcontrol">
                          <div className="flex items-center space-x-2 ">
                            <CirclePlus size={16} strokeWidth={2} />
                            <span>Subcontrol</span>
                          </div>
                        </Link>
                      )}
                    </>
                  }
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default ControlsTableToolbar
