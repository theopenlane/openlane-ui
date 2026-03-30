'use client'

import React, { useState, useMemo } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { type ColumnDef, type VisibilityState, type Row } from '@tanstack/react-table'
import { DataTable, getInitialSortConditions, getInitialPagination } from '@repo/ui/data-table'
import { type TPagination } from '@repo/ui/pagination-types'
import { TableKeyEnum } from '@repo/ui/table-key'
import { type TFile } from '@/components/shared/file-table/columns'
import { FILE_SORT_FIELDS } from '@/components/shared/file-table/table-config'
import { type FileOrder, type FileWhereInput, FileOrderField, OrderDirection } from '@repo/codegen/src/schema'
import { useGetEntityFilesPaginated, useUploadEntityFiles } from '@/lib/graphql-hooks/entity'
import { useGetEvidencesWithFileIds } from '@/lib/graphql-hooks/evidence'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { DocumentsUploadDialog } from '@/components/shared/documents-section/documents-upload-dialog'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { fileDownload } from '@/components/shared/lib/export'
import ColumnVisibilityMenu, { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu'
import Menu from '@/components/shared/menu/menu'
import { getMappedColumns } from '@/components/shared/crud-base/columns/get-mapped-columns'
import { Check, X, Download, DownloadIcon, Upload, SearchIcon, Eye, Trash2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import MarkAsEvidenceDialog from './mark-as-evidence-dialog'
import UnmarkEvidenceDialog from './unmark-evidence-dialog'
import DeleteDocumentDialog from './delete-document-dialog'

interface DocumentsTabProps {
  vendorId: string
  canEdit: boolean
  logoFileId?: string | null
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({ vendorId, canEdit, logoFileId }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pagination, setPagination] = useState<TPagination>(() => getInitialPagination(TableKeyEnum.ENTITY_FILES, DEFAULT_PAGINATION))
  const defaultSorting = getInitialSortConditions(TableKeyEnum.ENTITY_FILES, FileOrderField, [
    {
      field: FileOrderField.created_at,
      direction: OrderDirection.ASC,
    },
  ])
  const [orderBy, setOrderBy] = useState<FileOrder[]>(defaultSorting)
  const [searchTerm, setSearchTerm] = useState('')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableKeyEnum.ENTITY_FILES, {}))
  const { successNotification, errorNotification } = useNotification()

  const [markEvidenceFile, setMarkEvidenceFile] = useState<{ id: string; name: string } | null>(null)
  const [unmarkEvidenceFile, setUnmarkEvidenceFile] = useState<{ id: string; name: string } | null>(null)
  const [deleteFile, setDeleteFile] = useState<{ id: string; name: string } | null>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)

  const debouncedSearch = useDebounce(searchTerm, 300)
  const fileWhere: FileWhereInput | undefined = (() => {
    const where: FileWhereInput = {}
    if (debouncedSearch) where.providedFileNameContainsFold = debouncedSearch
    if (logoFileId) where.idNEQ = logoFileId
    return Object.keys(where).length > 0 ? where : undefined
  })()

  const { files, isLoading, isError, pageInfo, totalCount } = useGetEntityFilesPaginated({
    entityId: vendorId,
    orderBy,
    pagination,
    where: fileWhere,
  })

  const fileIds = useMemo(() => files.map((f) => f?.id).filter(Boolean) as string[], [files])

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

  const handleUpload = async (newFiles: File[]) => {
    try {
      await uploadFiles({
        updateEntityId: vendorId,
        input: {},
        entityFiles: newFiles,
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
    const visibleFiles = files.filter((f): f is TFile => !!f)
    if (visibleFiles.length === 0) return

    const headers = ['File Name', 'Category', 'Uploaded Date', 'Classified as Evidence']
    const rows = visibleFiles.map((f) => [f.providedFileName, f.categoryType || '', f.createdAt ? new Date(f.createdAt).toLocaleDateString() : '', fileToEvidenceMap.has(f.id) ? 'Yes' : 'No'])

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'vendor-documents.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const validFiles = files.filter((f): f is TFile => !!f)

  const isClassifiedAsEvidence = (file: TFile) => fileToEvidenceMap.has(file.id)

  const openEvidenceSheet = (fileId: string) => {
    const evidenceId = fileToEvidenceMap.get(fileId)
    if (!evidenceId) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('id', evidenceId)
    router.push(`${window.location.pathname}?${params.toString()}`)
  }

  const columns: ColumnDef<TFile>[] = [
    {
      accessorKey: 'providedFileName',
      header: 'File Name',
      size: 280,
      cell: ({ row }) => <span className="block truncate">{row.original.providedFileName}</span>,
    },
    {
      accessorKey: 'categoryType',
      header: 'Category',
      size: 150,
      cell: ({ row }) => <span>{row.original.categoryType || '-'}</span>,
    },
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
          <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} className="flex items-center gap-2 justify-end">
            {canEdit &&
              (classified ? (
                <Button variant="secondary" icon={<X />} iconPosition="left" onClick={() => setUnmarkEvidenceFile({ id: row.original.id, name: row.original.providedFileName })}>
                  Unmark Evidence
                </Button>
              ) : (
                <Button type="button" onClick={() => setMarkEvidenceFile({ id: row.original.id, name: row.original.providedFileName })}>
                  <Check size={14} />
                  Mark as Evidence
                </Button>
              ))}
            <Button type="button" variant="secondary" onClick={() => fileDownload(row.original.presignedURL || '', row.original.providedFileName, errorNotification)}>
              <Download size={16} />
            </Button>
            {canEdit && (
              <Button type="button" variant="secondary" onClick={() => setDeleteFile({ id: row.original.id, name: row.original.providedFileName })}>
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
          <Menu
            closeOnSelect={true}
            content={(close) => (
              <Button
                size="sm"
                variant="transparent"
                className="px-1 flex items-center justify-start space-x-2 cursor-pointer"
                onClick={() => {
                  handleExportCSV()
                  close()
                }}
              >
                <DownloadIcon size={16} strokeWidth={2} />
                <span>Export</span>
              </Button>
            )}
          />
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
        defaultSorting={defaultSorting}
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
