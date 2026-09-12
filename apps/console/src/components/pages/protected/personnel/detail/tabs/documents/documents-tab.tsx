'use client'

import React, { useState, useMemo } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { type VisibilityState } from '@repo/ui/table-types'
import { DataTable } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import { type TFile } from '@/components/shared/file-table/columns'
import { FILE_SORT_FIELDS } from '@/components/shared/file-table/table-config'
import { type FileWhereInput, FileOrderField, OrderDirection } from '@repo/codegen/src/schema'
import { useOrgTablePagination, useOrgTableSort } from '@/hooks/use-org-table-state'
import { useGetIdentityHolderFilesPaginated, useUploadIdentityHolderFiles, useUpdateIdentityHolder } from '@/lib/graphql-hooks/identity-holder'
import { useGetEvidencesWithFileIds } from '@/lib/graphql-hooks/evidence'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { DocumentsUploadDialog } from '@/components/shared/documents-section/documents-upload-dialog'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { exportToCSV } from '@/utils/exportToCSV'
import ColumnVisibilityMenu, { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu'
import Menu from '@/components/shared/menu/menu'
import { getMappedColumns } from '@/components/shared/crud-base/columns/get-mapped-columns'
import { getDocumentExportColumns, useDocumentTableColumns } from '@/components/shared/file-table/document-columns'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { Upload, SearchIcon } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import MarkAsEvidenceDialog from './mark-as-evidence-dialog'
import UnmarkEvidenceDialog from '@/components/pages/protected/vendors/detail/tabs/documents/unmark-evidence-dialog'
import ExportMenuItem from '@/components/shared/export/export-menu-item'

interface DocumentsTabProps {
  personnelId: string
  canEdit: boolean
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({ personnelId, canEdit }) => {
  const queryClient = useQueryClient()
  const [pagination, setPagination] = useOrgTablePagination(DEFAULT_PAGINATION, TableKeyEnum.IDENTITY_HOLDER_FILES)
  const [orderBy, setOrderBy] = useOrgTableSort(TableKeyEnum.IDENTITY_HOLDER_FILES, FileOrderField, [
    {
      field: FileOrderField.created_at,
      direction: OrderDirection.ASC,
    },
  ])
  const [searchTerm, setSearchTerm] = useState('')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableKeyEnum.IDENTITY_HOLDER_FILES, {}))
  const { successNotification, errorNotification } = useNotification()

  const [markEvidenceFile, setMarkEvidenceFile] = useState<TFile | null>(null)
  const [unmarkEvidenceFile, setUnmarkEvidenceFile] = useState<TFile | null>(null)
  const [deleteFile, setDeleteFile] = useState<TFile | null>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)

  const debouncedSearch = useDebounce(searchTerm, 300)
  const fileWhere: FileWhereInput | undefined = debouncedSearch ? { providedFileNameContainsFold: debouncedSearch } : undefined

  const { files, isLoading, isError, pageInfo, totalCount } = useGetIdentityHolderFilesPaginated({
    identityHolderId: personnelId,
    orderBy,
    pagination,
    where: fileWhere,
  })

  const fileIds = useMemo(() => files.map((f) => f.id), [files])

  const { data: evidencesData } = useGetEvidencesWithFileIds(fileIds)

  const fileToEvidenceMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const edge of evidencesData?.evidences?.edges ?? []) {
      const evidenceId = edge?.node?.id
      if (!evidenceId) continue
      for (const fileEdge of edge?.node?.files?.edges ?? []) {
        if (fileEdge?.node?.id) map.set(fileEdge.node.id, evidenceId)
      }
    }
    return map
  }, [evidencesData])

  const { mutateAsync: uploadFiles, isPending: isUploading } = useUploadIdentityHolderFiles()
  const { mutateAsync: updateIdentityHolder } = useUpdateIdentityHolder()

  const handleUpload = async (newFiles: File[]) => {
    try {
      await uploadFiles({
        updateIdentityHolderId: personnelId,
        input: {},
        identityHolderFiles: newFiles,
      })
      successNotification({
        title: 'Documents uploaded',
        description: 'Documents have been successfully uploaded.',
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
      throw error
    }
  }

  const handleDeleteFile = async () => {
    if (!deleteFile) return
    try {
      await updateIdentityHolder({
        updateIdentityHolderId: personnelId,
        input: {
          removeFileIDs: [deleteFile.id],
        },
      })
      queryClient.invalidateQueries({ queryKey: ['identityHolderFiles'] })
      successNotification({
        title: 'Document removed',
        description: `"${deleteFile.providedFileName}" has been removed.`,
      })
      setDeleteFile(null)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleExportCSV = () => {
    if (files.length === 0) return

    exportToCSV(files, getDocumentExportColumns(fileToEvidenceMap), 'personnel-documents')
  }

  const columns = useDocumentTableColumns({
    canEdit,
    fileToEvidenceMap,
    onMarkEvidence: setMarkEvidenceFile,
    onUnmarkEvidence: setUnmarkEvidenceFile,
    onDelete: setDeleteFile,
  })

  const mappedColumns = getMappedColumns(columns)

  if (isError) {
    return <p className="text-red-500">Error loading documents</p>
  }

  return (
    <div className="mt-5">
      <div className="flex items-center gap-2 mb-3">
        <Input icon={<SearchIcon size={16} />} placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.currentTarget.value)} variant="searchTable" />
        <div className="grow flex flex-row items-center gap-2 justify-end">
          <Menu closeOnSelect={true} content={(close) => <ExportMenuItem onExport={handleExportCSV} onSelected={close} />} />
          <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} storageKey={TableKeyEnum.IDENTITY_HOLDER_FILES} />
          {canEdit && (
            <Button variant="primary" icon={<Upload />} iconPosition="left" onClick={() => setIsUploadDialogOpen(true)}>
              Upload
            </Button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        sortFields={FILE_SORT_FIELDS}
        sorting={orderBy}
        onSortChange={setOrderBy}
        data={files}
        loading={isLoading}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={{ totalCount: totalCount, pageInfo: pageInfo, isLoading: isLoading }}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        tableKey={TableKeyEnum.IDENTITY_HOLDER_FILES}
      />

      {markEvidenceFile && <MarkAsEvidenceDialog fileId={markEvidenceFile.id} fileName={markEvidenceFile.providedFileName} personnelId={personnelId} onClose={() => setMarkEvidenceFile(null)} />}
      {unmarkEvidenceFile && <UnmarkEvidenceDialog fileId={unmarkEvidenceFile.id} fileName={unmarkEvidenceFile.providedFileName} onClose={() => setUnmarkEvidenceFile(null)} />}
      {deleteFile && (
        <ConfirmationDialog
          open
          onOpenChange={(open) => !open && setDeleteFile(null)}
          onConfirm={handleDeleteFile}
          title="Remove document?"
          description={
            <>
              Are you sure you want to remove <b>{deleteFile.providedFileName}</b>? This action cannot be undone.
            </>
          }
        />
      )}
      {canEdit && <DocumentsUploadDialog onUpload={handleUpload} isUploading={isUploading} title="Upload Documents" open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen} />}
    </div>
  )
}

export default DocumentsTab
