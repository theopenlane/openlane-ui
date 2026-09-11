'use client'

import React, { useState, useMemo } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { type ColumnDef, type VisibilityState, type Row } from '@repo/ui/table-types'
import { DataTable } from '@repo/ui/data-table'
import { useOrgTablePagination, useOrgTableSort } from '@/hooks/use-org-table-state'
import { TableKeyEnum } from '@repo/ui/table-key'
import { createFileCategoryColumn, fileNameColumn, getFileCategory, getFileDisplayName, originalFileNameColumn, type TFile } from '@/components/shared/file-table/columns'
import { FILE_SORT_FIELDS } from '@/components/shared/file-table/table-config'
import { type FileWhereInput, FileOrderField, OrderDirection } from '@repo/codegen/src/schema'
import { useGetEntityFilesPaginated, useUploadEntityFiles } from '@/lib/graphql-hooks/entity'
import { useGetEvidencesWithFileIds } from '@/lib/graphql-hooks/evidence'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { DocumentsUploadDialog } from '@/components/shared/documents-section/documents-upload-dialog'
import { FILE_CATEGORY_ENUM, toFileUploadArgs, type StagedUpload } from '@/components/shared/documents-section/staged-upload'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { exportToCSV } from '@/utils/exportToCSV'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { fileDownload } from '@/components/shared/lib/export'
import ColumnVisibilityMenu, { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu'
import Menu from '@/components/shared/menu/menu'
import { getMappedColumns } from '@/components/shared/crud-base/columns/get-mapped-columns'
import { Check, X, Download, Upload, SearchIcon, Eye, Trash2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import MarkAsEvidenceDialog from './mark-as-evidence-dialog'
import UnmarkEvidenceDialog from './unmark-evidence-dialog'
import DeleteDocumentDialog from './delete-document-dialog'
import ExportMenuItem from '@/components/shared/export/export-menu-item'

interface DocumentsTabProps {
  vendorId: string
  canEdit: boolean
  logoFileId?: string | null
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({ vendorId, canEdit, logoFileId }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pagination, setPagination] = useOrgTablePagination(DEFAULT_PAGINATION, TableKeyEnum.ENTITY_FILES)
  const [orderBy, setOrderBy] = useOrgTableSort(TableKeyEnum.ENTITY_FILES, FileOrderField, [
    {
      field: FileOrderField.created_at,
      direction: OrderDirection.ASC,
    },
  ])
  const [searchTerm, setSearchTerm] = useState('')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableKeyEnum.ENTITY_FILES, { providedFileName: false }))
  const { successNotification, errorNotification } = useNotification()
  const { enumOptions: categoryOptions } = useCreatableEnumOptions(FILE_CATEGORY_ENUM)

  const [markEvidenceFile, setMarkEvidenceFile] = useState<{ id: string; name: string } | null>(null)
  const [unmarkEvidenceFile, setUnmarkEvidenceFile] = useState<{ id: string; name: string } | null>(null)
  const [deleteFile, setDeleteFile] = useState<{ id: string; name: string } | null>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)

  const debouncedSearch = useDebounce(searchTerm, 300)
  const fileWhere: FileWhereInput | undefined = (() => {
    const where: FileWhereInput = {}
    if (debouncedSearch) where.or = [{ providedFileNameContainsFold: debouncedSearch }, { nameContainsFold: debouncedSearch }]
    if (logoFileId) where.idNEQ = logoFileId
    return Object.keys(where).length > 0 ? where : undefined
  })()

  const { files, isLoading, isError, pageInfo, totalCount } = useGetEntityFilesPaginated({
    entityId: vendorId,
    orderBy,
    pagination,
    where: fileWhere,
  })

  const validFiles = useMemo(() => files.filter((f) => !!f), [files])

  const fileIds = useMemo(() => validFiles.map((f) => f.id), [validFiles])

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

  const { mutateAsync: uploadFiles, isPending: isUploading } = useUploadEntityFiles()

  const handleUpload = async (uploads: StagedUpload[]) => {
    try {
      const { files: entityFiles, metadata: entityFilesMetadata } = toFileUploadArgs(uploads)

      await uploadFiles({
        updateEntityId: vendorId,
        input: {},
        entityFiles,
        entityFilesMetadata,
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

  const handleExportCSV = () => {
    if (validFiles.length === 0) return

    exportToCSV(
      validFiles,
      [
        { label: 'Name', accessor: (f) => getFileDisplayName(f) },
        { label: 'File Name', accessor: (f) => f.providedFileName },
        { label: 'Category', accessor: (f) => getFileCategory(f) ?? '' },
        { label: 'Uploaded Date', accessor: (f) => (f.createdAt ? new Date(f.createdAt).toLocaleDateString() : '') },
        { label: 'Classified as Evidence', accessor: (f) => (fileToEvidenceMap.has(f.id) ? 'Yes' : 'No') },
      ],
      'vendor-documents',
    )
  }

  const isClassifiedAsEvidence = (file: TFile) => fileToEvidenceMap.has(file.id)

  const openEvidenceSheet = (fileId: string) => {
    const evidenceId = fileToEvidenceMap.get(fileId)
    if (!evidenceId) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('id', evidenceId)
    router.push(`${window.location.pathname}?${params.toString()}`)
  }

  const columns: ColumnDef<TFile>[] = [
    fileNameColumn,
    originalFileNameColumn,
    createFileCategoryColumn(categoryOptions),
    {
      accessorKey: 'createdAt',
      header: 'Uploaded Date',
      size: 150,
      cell: ({ row }) => <DateCell value={row.original.createdAt} />,
    },
    {
      id: 'classifiedAsEvidence',
      header: 'Evidence?',
      size: 120,
      maxSize: 120,
      minSize: 120,
      cell: ({ row }) => {
        const classified = isClassifiedAsEvidence(row.original)
        return (
          <div className="flex items-center gap-2">
            {classified ? (
              <>
                <Check size={16} className="text-success" />
                <span>Yes</span>
                <button
                  type="button"
                  className="p-0 bg-transparent border-0 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="View evidence"
                  onClick={(e) => {
                    e.stopPropagation()
                    openEvidenceSheet(row.original.id)
                  }}
                >
                  <Eye size={16} />
                </button>
              </>
            ) : (
              <>
                <X size={16} className="text-destructive" />
                <span>No</span>
              </>
            )}
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      size: 260,
      maxSize: 260,
      minSize: 260,
      cell: ({ row }: { row: Row<TFile> }) => {
        const classified = isClassifiedAsEvidence(row.original)
        return (
          <div role="presentation" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} className="flex items-center gap-2 justify-end">
            {canEdit &&
              (classified ? (
                <Button variant="secondary" icon={<X />} iconPosition="left" onClick={() => setUnmarkEvidenceFile({ id: row.original.id, name: getFileDisplayName(row.original) })}>
                  Unmark Evidence
                </Button>
              ) : (
                <Button type="button" onClick={() => setMarkEvidenceFile({ id: row.original.id, name: getFileDisplayName(row.original) })}>
                  <Check size={14} />
                  Mark as Evidence
                </Button>
              ))}
            <Button type="button" variant="secondary" onClick={() => fileDownload(row.original.presignedURL || '', row.original.providedFileName, errorNotification)}>
              <Download size={16} />
            </Button>
            {canEdit && (
              <Button type="button" variant="secondary" onClick={() => setDeleteFile({ id: row.original.id, name: getFileDisplayName(row.original) })}>
                <Trash2 size={16} />
              </Button>
            )}
          </div>
        )
      },
    } as ColumnDef<TFile>,
  ]

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
          <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} storageKey={TableKeyEnum.ENTITY_FILES} />
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
        data={validFiles}
        loading={isLoading}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={{ totalCount: totalCount, pageInfo: pageInfo, isLoading: isLoading }}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        tableKey={TableKeyEnum.ENTITY_FILES}
      />

      {markEvidenceFile && <MarkAsEvidenceDialog fileId={markEvidenceFile.id} fileName={markEvidenceFile.name} vendorId={vendorId} onClose={() => setMarkEvidenceFile(null)} />}
      {unmarkEvidenceFile && <UnmarkEvidenceDialog fileId={unmarkEvidenceFile.id} fileName={unmarkEvidenceFile.name} onClose={() => setUnmarkEvidenceFile(null)} />}
      {deleteFile && <DeleteDocumentDialog fileId={deleteFile.id} fileName={deleteFile.name} vendorId={vendorId} onClose={() => setDeleteFile(null)} />}
      {canEdit && <DocumentsUploadDialog onUpload={handleUpload} isUploading={isUploading} title="Upload Documents" open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen} />}
    </div>
  )
}

export default DocumentsTab
