import React, { useMemo, useState } from 'react'
import { TableFilter } from '@/components/shared/table-filter/table-filter.tsx'
import { LoaderCircle, SearchIcon, Upload } from 'lucide-react'
import { Input } from '@repo/ui/input'
import { useDebounce } from '@uidotdev/usehooks'
import { VisibilityState } from '@tanstack/react-table'
import ColumnVisibilityMenu from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { getEvidenceFilterableFields } from '@/components/pages/protected/evidence/table/table-config.ts'
import { TableKeyEnum } from '@repo/ui/table-key'
import Menu from '@/components/shared/menu/menu'
import { BulkCSVCreateEvidenceDialog } from '../dialog/bulk-csv-create-evidence-dialog'
import { TAccessRole, TPermissionData } from '@/types/authz'
import { useBulkDeleteEvidence } from '@/lib/graphql-hooks/evidence'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { Button } from '@repo/ui/button'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { BulkEditEvidenceDialog } from '../bulk-edit/bulk-edit-evidence'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useOrganization } from '@/hooks/useOrganization'
import { useStandardsSelect } from '@/lib/graphql-hooks/standard'

type TEvidenceTableToolbarProps = {
  className?: string
  searching?: boolean
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  setFilters: (filters: Record<string, unknown>) => void
  columnVisibility?: VisibilityState
  setColumnVisibility?: React.Dispatch<React.SetStateAction<VisibilityState>>
  mappedColumns: {
    accessorKey: string
    header: string
  }[]
  selectedEvidence: { id: string }[]
  setSelectedEvidence: React.Dispatch<React.SetStateAction<{ id: string }[]>>
  canEdit: (accessRole: TAccessRole[] | undefined) => boolean
  permission: TPermissionData | undefined
}

const EvidenceTableToolbar: React.FC<TEvidenceTableToolbarProps> = ({
  searching,
  searchTerm,
  setFilters,
  setSearchTerm,
  columnVisibility,
  setColumnVisibility,
  mappedColumns,
  selectedEvidence,
  setSelectedEvidence,
  canEdit,
  permission,
}) => {
  const { mutateAsync: bulkDeleteEvidence } = useBulkDeleteEvidence()
  const { successNotification, errorNotification } = useNotification()
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const isSearching = useDebounce(searching, 200)
  const { currentOrgId } = useOrganization()
  const { standardOptions } = useStandardsSelect({
    where: {
      hasControlsWith: [
        {
          hasOwnerWith: [{ id: currentOrgId }],
        },
      ],
    },
    enabled: Boolean(currentOrgId),
  })
  const filterFields = useMemo(() => getEvidenceFilterableFields(standardOptions), [standardOptions])
  const handleBulkDelete = async () => {
    if (selectedEvidence.length === 0) {
      errorNotification({
        title: 'Missing evidence',
        description: 'Evidence not found.',
      })
      return
    }

    try {
      await bulkDeleteEvidence({ ids: selectedEvidence.map((evidence) => evidence.id) })
      successNotification({
        title: 'Selected evidence have been successfully deleted.',
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setIsBulkDeleteDialogOpen(false)
      setSelectedEvidence([])
    }
  }

  return (
    <>
      <div className="relative flex items-center gap-2 my-2">
        <Input
          icon={isSearching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
          placeholder="Search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.currentTarget.value)}
          variant="searchTable"
        />
        <div className="grow flex flex-row items-center gap-2 justify-end">
          {selectedEvidence.length > 0 ? (
            <>
              {canEdit(permission?.roles) && <BulkEditEvidenceDialog selectedEvidence={selectedEvidence} setSelectedEvidence={setSelectedEvidence}></BulkEditEvidenceDialog>}
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsBulkDeleteDialogOpen(true)
                }}
              >
                {selectedEvidence && selectedEvidence.length > 0 ? `Bulk Delete (${selectedEvidence.length})` : 'Bulk Delete'}
              </Button>
              {canEdit(permission?.roles) && (
                <>
                  <ConfirmationDialog
                    open={isBulkDeleteDialogOpen}
                    onOpenChange={setIsBulkDeleteDialogOpen}
                    onConfirm={handleBulkDelete}
                    title={`Delete selected evidence?`}
                    description={<>This action cannot be undone. This will permanently delete selected evidence.</>}
                    confirmationText="Delete"
                    confirmationTextVariant="destructive"
                    showInput={false}
                  />
                  <CancelButton
                    onClick={() => {
                      setSelectedEvidence([])
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
                    <BulkCSVCreateEvidenceDialog
                      trigger={
                        <div className="flex items-center space-x-2 px-1">
                          <Upload size={16} strokeWidth={2} />
                          <span>Bulk Upload</span>
                        </div>
                      }
                    />
                  </>
                }
              />
              {mappedColumns && columnVisibility && setColumnVisibility && (
                <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} storageKey={TableKeyEnum.EVIDENCE} />
              )}
              <TableFilter filterFields={filterFields} onFilterChange={setFilters} pageKey={TableKeyEnum.EVIDENCE} />
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default EvidenceTableToolbar
