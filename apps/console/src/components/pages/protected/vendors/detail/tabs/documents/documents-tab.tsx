'use client'

import React, { useState, useMemo } from 'react'
import { type ColumnDef, type VisibilityState, type Row } from '@tanstack/react-table'
import { DataTable, getInitialSortConditions, getInitialPagination } from '@repo/ui/data-table'
import { type TPagination } from '@repo/ui/pagination-types'
import { TableKeyEnum } from '@repo/ui/table-key'
import { type TFile } from '@/components/shared/file-table/columns'
import { FILE_SORT_FIELDS } from '@/components/shared/file-table/table-config'
import { type FileOrder, FileOrderField, OrderDirection } from '@repo/codegen/src/schema'
import { useQuery } from '@tanstack/react-query'
import { gql } from 'graphql-request'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { useGetEntityFilesPaginated, useUploadEntityFiles } from '@/lib/graphql-hooks/entity'
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
import { TableFilter } from '@/components/shared/table-filter/table-filter'
import { Check, X, Download, DownloadIcon, Upload, SearchIcon } from 'lucide-react'
import MarkAsEvidenceDialog from './mark-as-evidence-dialog'
import UnmarkEvidenceDialog from './unmark-evidence-dialog'

const GET_EVIDENCES_WITH_FILE_IDS = gql`
  query GetEvidencesWithFileIds($where: EvidenceWhereInput) {
    evidences(where: $where, first: 100) {
      edges {
        node {
          id
          files {
            edges {
              node {
                id
              }
            }
          }
        }
      }
    }
  }
`

interface DocumentsTabProps {
  vendorId: string
  canEdit: boolean
}

const COLUMN_VISIBILITY_DEFAULTS: VisibilityState = {
  providedFileName: true,
  categoryType: true,
  createdAt: true,
  classifiedAsEvidence: true,
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({ vendorId, canEdit }) => {
  const [pagination, setPagination] = useState<TPagination>(() => getInitialPagination(TableKeyEnum.ENTITY_FILES, DEFAULT_PAGINATION))
  const defaultSorting = getInitialSortConditions(TableKeyEnum.ENTITY_FILES, FileOrderField, [
    {
      field: FileOrderField.created_at,
      direction: OrderDirection.ASC,
    },
  ])
  const [orderBy, setOrderBy] = useState<FileOrder[]>(defaultSorting)
  const [searchTerm, setSearchTerm] = useState('')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableKeyEnum.ENTITY_FILES, COLUMN_VISIBILITY_DEFAULTS))
  const { successNotification, errorNotification } = useNotification()

  const [markEvidenceFile, setMarkEvidenceFile] = useState<{ id: string; name: string } | null>(null)
  const [unmarkEvidenceFile, setUnmarkEvidenceFile] = useState<{ id: string; name: string } | null>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)

  const { client } = useGraphQLClient()

  const { files, isLoading, isError, pageInfo, totalCount } = useGetEntityFilesPaginated({
    entityId: vendorId,
    orderBy,
    pagination,
  })

  const fileIds = useMemo(() => files.map((f) => f?.id).filter(Boolean) as string[], [files])

  const { data: evidencesData } = useQuery({
    queryKey: ['evidences', 'byFiles', fileIds],
    queryFn: async () =>
      client.request<{ evidences: { edges: Array<{ node: { id: string; files: { edges: Array<{ node: { id: string } }> } } }> } }>(GET_EVIDENCES_WITH_FILE_IDS, {
        where: { hasFilesWith: [{ idIn: fileIds }] },
      }),
    enabled: fileIds.length > 0,
  })

  const evidenceFileIds = useMemo(() => {
    const ids = new Set<string>()
    for (const edge of evidencesData?.evidences?.edges ?? []) {
      for (const fileEdge of edge?.node?.files?.edges ?? []) {
        ids.add(fileEdge?.node?.id)
      }
    }
    return ids
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
    const rows = visibleFiles.map((f) => [f.providedFileName, f.categoryType || '', f.createdAt ? new Date(f.createdAt).toLocaleDateString() : '', evidenceFileIds.has(f.id) ? 'Yes' : 'No'])

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

  const filteredFiles = files.filter((f): f is TFile => {
    if (!f) return false
    if (!searchTerm) return true
    return f.providedFileName.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const isClassifiedAsEvidence = (file: TFile) => evidenceFileIds.has(file.id)

  const columns: ColumnDef<TFile>[] = [
    {
      accessorKey: 'providedFileName',
      header: 'File Name',
      size: 280,
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
      header: 'Classified as Evidence',
      size: 180,
      cell: ({ row }) => {
        const classified = isClassifiedAsEvidence(row.original)
        return (
          <div className="flex items-center gap-2">
            {classified ? (
              <>
                <Check size={16} className="text-success" />
                <span>Yes</span>
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
          </div>
        )
      },
    } as ColumnDef<TFile>,
  ]

  const mappedColumns = columns
    .filter((column): column is ColumnDef<TFile> & { accessorKey: string; header: string } => {
      const col = column as { accessorKey?: string; header?: string }
      return typeof col.accessorKey === 'string' && typeof col.header === 'string'
    })
    .map((column) => ({
      accessorKey: column.accessorKey,
      header: column.header as string,
    }))

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
              <>
                {canEdit && (
                  <Button
                    size="sm"
                    variant="transparent"
                    className="px-1 flex items-center justify-start space-x-2 cursor-pointer"
                    onClick={() => {
                      setIsUploadDialogOpen(true)
                      close()
                    }}
                  >
                    <Upload size={16} strokeWidth={2} />
                    <span>Bulk Upload</span>
                  </Button>
                )}
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
              </>
            )}
          />
          <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} storageKey={TableKeyEnum.ENTITY_FILES} />
          <TableFilter filterFields={[]} onFilterChange={() => {}} pageKey={TableKeyEnum.ENTITY_FILES} />
        </div>
      </div>

      <DataTable
        columns={columns}
        sortFields={FILE_SORT_FIELDS}
        defaultSorting={defaultSorting}
        onSortChange={setOrderBy}
        data={filteredFiles}
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
      {canEdit && <DocumentsUploadDialog onUpload={handleUpload} isUploading={isUploading} title="Upload Documents" open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen} />}
    </div>
  )
}

export default DocumentsTab
