import React, { useMemo, useState } from 'react'
import { TableFilter } from '@/components/shared/table-filter/table-filter.tsx'
import { DownloadIcon, LoaderCircle, SearchIcon, Upload } from 'lucide-react'
import { Input } from '@repo/ui/input'
import { useDebounce } from '@uidotdev/usehooks'
import { getQuestionnaireFilterFields } from '@/components/pages/protected/questionnaire/table/table-config.ts'
import { includeQuestionnaireCreation } from '@repo/dally/auth'
import { CreateDropdown } from '@/components/pages/protected/questionnaire/create.tsx'
import Menu from '@/components/shared/menu/menu.tsx'
import { VisibilityState } from '@tanstack/react-table'
import ColumnVisibilityMenu from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { AssessmentWhereInput, TemplateTemplateKind } from '@repo/codegen/src/schema'
import { BulkCSVCreateTemplatelDialog } from '../dialog/bulk-csv-create-template-dialog'
import { canCreate } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { TableFilterKeysEnum } from '@/components/shared/table-filter/table-filter-keys.ts'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { Button } from '@repo/ui/button'
import { TableColumnVisibilityKeysEnum } from '@/components/shared/table-column-visibility/table-column-visibility-keys.ts'
import { TAccessRole } from '@/types/authz'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useNotification } from '@/hooks/useNotification'
import { useDeleteBulkAssessment } from '@/lib/graphql-hooks/assessments'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useGetTags } from '@/lib/graphql-hooks/tags'
import { useTemplateSelect } from '@/lib/graphql-hooks/templates'

type TQuestionnaireTableToolbarProps = {
  creating: boolean
  searching?: boolean
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  setFilters: (filters: AssessmentWhereInput) => void
  columnVisibility?: VisibilityState
  handleExport: () => void
  setColumnVisibility?: React.Dispatch<React.SetStateAction<VisibilityState>>
  mappedColumns: {
    accessorKey: string
    header: string
  }[]
  exportEnabled: boolean
  selectedQuestionnaires: { id: string }[]
  setSelectedQuestionnaires: React.Dispatch<React.SetStateAction<{ id: string }[]>>
  canEdit: (accessRole: TAccessRole[] | undefined) => boolean
  handleClearSelectedQuestionnaires: () => void
}

const QuestionnaireTableToolbar: React.FC<TQuestionnaireTableToolbarProps> = ({
  creating,
  searching,
  searchTerm,
  setFilters,
  setSearchTerm,
  columnVisibility,
  setColumnVisibility,
  mappedColumns,
  handleExport,
  exportEnabled,
  selectedQuestionnaires,
  setSelectedQuestionnaires,
  canEdit,
  handleClearSelectedQuestionnaires,
}) => {
  const isSearching = useDebounce(searching, 200)
  const { data: permission } = useOrganizationRoles()
  const canEditQuestionnaires = canEdit(permission?.roles)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: bulkDeleteQuestionnaires } = useDeleteBulkAssessment()

  const { tagOptions: rawTagOptions } = useGetTags()
  const tagOptions = useMemo(() => rawTagOptions ?? [], [rawTagOptions])

  const { templateOptions } = useTemplateSelect({ where: { kind: TemplateTemplateKind.QUESTIONNAIRE } })

  const filterFields = useMemo(() => getQuestionnaireFilterFields(tagOptions, templateOptions), [tagOptions, templateOptions])

  const createDropdown = () => {
    if (includeQuestionnaireCreation == 'true' && canCreate(permission?.roles, AccessEnum.CanCreateTemplate)) {
      return <CreateDropdown />
    }
  }

  const handleBulkDelete = async () => {
    if (selectedQuestionnaires.length === 0) {
      errorNotification({
        title: 'Missing questionnaires',
        description: 'Questionnaires not found.',
      })
      return
    }

    try {
      await bulkDeleteQuestionnaires({ ids: selectedQuestionnaires.map((questionnaire) => questionnaire.id) })
      successNotification({
        title: 'Selected questionnaires have been successfully deleted.',
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setIsBulkDeleteDialogOpen(false)
      setSelectedQuestionnaires([])
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 my-2">
        <div className="grow flex flex-row items-center gap-2">
          <Input
            icon={isSearching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
            placeholder="Search"
            value={searchTerm}
            disabled={creating}
            onChange={(event) => setSearchTerm(event.currentTarget.value)}
            variant="searchTable"
          />
        </div>
        <div className="grow flex flex-row items-center gap-2 justify-end">
          {selectedQuestionnaires.length > 0 ? (
            <>
              {canEditQuestionnaires && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsBulkDeleteDialogOpen(true)
                  }}
                >
                  {`Bulk Delete (${selectedQuestionnaires.length})`}
                </Button>
              )}
              {canEditQuestionnaires && (
                <ConfirmationDialog
                  open={isBulkDeleteDialogOpen}
                  onOpenChange={setIsBulkDeleteDialogOpen}
                  onConfirm={handleBulkDelete}
                  title={`Delete selected questionnaires?`}
                  description={<>This action cannot be undone. This will permanently delete selected questionnaires.</>}
                  confirmationText="Delete"
                  confirmationTextVariant="destructive"
                  showInput={false}
                />
              )}
              <CancelButton
                onClick={() => {
                  handleClearSelectedQuestionnaires()
                }}
              />
            </>
          ) : (
            <>
              <Menu
                content={
                  <>
                    <BulkCSVCreateTemplatelDialog
                      trigger={
                        <Button size="sm" variant="transparent" className="px-1 flex items-center justify-start space-x-2">
                          <Upload size={16} strokeWidth={2} />
                          <span>Bulk Upload</span>
                        </Button>
                      }
                    />
                    <Button size="sm" variant="transparent" className={`px-1 flex items-center justify-start space-x-2`} onClick={handleExport} disabled={!exportEnabled}>
                      <DownloadIcon size={16} strokeWidth={2} />
                      <span>Export</span>
                    </Button>
                  </>
                }
              />
              {mappedColumns && columnVisibility && setColumnVisibility && (
                <ColumnVisibilityMenu
                  mappedColumns={mappedColumns}
                  columnVisibility={columnVisibility}
                  setColumnVisibility={setColumnVisibility}
                  storageKey={TableColumnVisibilityKeysEnum.QUESTIONNAIRE}
                />
              )}
              <TableFilter filterFields={filterFields} onFilterChange={setFilters} pageKey={TableFilterKeysEnum.QUESTIONNAIRE} />
              {createDropdown()}
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default QuestionnaireTableToolbar
