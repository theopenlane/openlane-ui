import React, { useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { type ColumnDef } from '@repo/ui/table-types'
import { Check, X, Download, Eye, Trash2 } from 'lucide-react'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { createRowActionsColumn } from '@/components/shared/crud-base/columns/row-actions-column'
import { fileDownload } from '@/components/shared/lib/export'
import { useNotification, type TErrorProps } from '@/hooks/useNotification'
import { type TExportColumn } from '@/utils/exportToCSV'
import { useCreatableEnumOptions, type CustomTypeEnumOption } from '@/lib/graphql-hooks/custom-type-enum'
import { FILE_CATEGORY_ENUM } from '@/components/shared/documents-section/staged-upload'
import { createFileCategoryColumn, fileNameColumn, getFileCategory, getFileDisplayName, originalFileNameColumn, type TFile } from './columns'

const VIEW_EVIDENCE_ICON = <Eye size={16} />
const MARK_EVIDENCE_ICON = <Check size={16} />
const UNMARK_EVIDENCE_ICON = <X size={16} />
const DOWNLOAD_ICON = <Download size={16} />
const DELETE_ICON = <Trash2 size={16} />

type GetEvidenceId = (file: TFile) => string | undefined

type DocumentColumnsOptions = {
  canEdit: boolean
  categoryOptions: CustomTypeEnumOption[]
  errorNotification: (props: TErrorProps) => void
  getEvidenceId: GetEvidenceId
  onViewEvidence: (evidenceId: string) => void
  onMarkEvidence: (file: TFile) => void
  onUnmarkEvidence: (file: TFile) => void
  onDelete: (file: TFile) => void
}

export const getDocumentExportColumns = (fileToEvidenceMap: Map<string, string>): TExportColumn<TFile>[] => [
  { label: 'Name', accessor: (file) => getFileDisplayName(file) },
  { label: 'File Name', accessor: (file) => file.providedFileName },
  { label: 'Category', accessor: (file) => getFileCategory(file) ?? '' },
  { label: 'Uploaded Date', accessor: (file) => (file.createdAt ? new Date(file.createdAt).toLocaleDateString() : '') },
  { label: 'Classified as Evidence', accessor: (file) => (fileToEvidenceMap.has(file.id) ? 'Yes' : 'No') },
]

export const getDocumentColumns = ({
  canEdit,
  categoryOptions,
  errorNotification,
  getEvidenceId,
  onViewEvidence,
  onMarkEvidence,
  onUnmarkEvidence,
  onDelete,
}: DocumentColumnsOptions): ColumnDef<TFile>[] => [
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
      const classified = !!getEvidenceId(row.original)
      return (
        <div className="flex items-center gap-2">
          {classified ? <Check size={16} className="text-success" /> : <X size={16} className="text-destructive" />}
          <span>{classified ? 'Yes' : 'No'}</span>
        </div>
      )
    },
  },
  createRowActionsColumn<TFile>({
    label: 'Document actions',
    actions: [
      {
        label: 'View evidence',
        icon: VIEW_EVIDENCE_ICON,
        onClick: (file) => {
          const evidenceId = getEvidenceId(file)
          if (evidenceId) onViewEvidence(evidenceId)
        },
        hidden: (file) => !getEvidenceId(file),
      },
      {
        label: 'Mark as Evidence',
        icon: MARK_EVIDENCE_ICON,
        onClick: onMarkEvidence,
        hidden: (file) => !canEdit || !!getEvidenceId(file),
      },
      {
        label: 'Unmark Evidence',
        icon: UNMARK_EVIDENCE_ICON,
        onClick: onUnmarkEvidence,
        hidden: (file) => !canEdit || !getEvidenceId(file),
      },
      {
        label: 'Download',
        icon: DOWNLOAD_ICON,
        onClick: (file) => fileDownload(file.presignedURL || '', getFileDisplayName(file), errorNotification),
        disabled: (file) => !file.presignedURL,
      },
      {
        label: 'Delete',
        icon: DELETE_ICON,
        onClick: onDelete,
        hidden: !canEdit,
      },
    ],
  }),
]

type DocumentTableColumnsOptions = {
  canEdit: boolean
  fileToEvidenceMap: Map<string, string>
  onMarkEvidence: (file: TFile) => void
  onUnmarkEvidence: (file: TFile) => void
  onDelete: (file: TFile) => void
}

export const useDocumentTableColumns = ({ canEdit, fileToEvidenceMap, onMarkEvidence, onUnmarkEvidence, onDelete }: DocumentTableColumnsOptions): ColumnDef<TFile>[] => {
  const router = useRouter()
  const pathname = usePathname()
  const { errorNotification } = useNotification()
  const { enumOptions: categoryOptions } = useCreatableEnumOptions(FILE_CATEGORY_ENUM)

  return useMemo(
    () =>
      getDocumentColumns({
        canEdit,
        categoryOptions,
        errorNotification,
        getEvidenceId: (file) => fileToEvidenceMap.get(file.id),
        onViewEvidence: (evidenceId) => {
          const params = new URLSearchParams(window.location.search)
          params.set('id', evidenceId)
          router.push(`${pathname}?${params.toString()}`)
        },
        onMarkEvidence,
        onUnmarkEvidence,
        onDelete,
      }),
    [canEdit, categoryOptions, errorNotification, fileToEvidenceMap, onMarkEvidence, onUnmarkEvidence, onDelete, router, pathname],
  )
}
