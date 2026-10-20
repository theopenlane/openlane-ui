'use client'

import React from 'react'
import { FileText, X } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import { FileOrderField, OrderDirection, type FileWhereInput } from '@repo/codegen/src/schema'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { pdfAcceptedFileTypes, pdfAcceptedFileTypesShort } from '@/components/shared/file-upload/file-upload-config'
import { SearchableItemSelect } from '@/components/shared/searchable-item-select/searchable-item-select'
import { useAsyncCommandSearch } from '@/hooks/useAsyncCommandSearch'
import { useGetEntityFilesPaginated } from '@/lib/graphql-hooks/entity'
import { type TReportScanFile } from '@/lib/graphql-hooks/report-scan'
import { formatFileSize } from '@/utils/strings'
import { PDF_MIME_TYPE } from '@/components/shared/file-preview/preview-mime'
import { getFileDisplayName } from '@/components/shared/file-table/columns'

const MAX_REPORT_SIZE_MB = 50

const VENDOR_REPORT_PAGE_SIZE = 20

const VENDOR_REPORT_PAGINATION = { page: 1, pageSize: VENDOR_REPORT_PAGE_SIZE, query: { first: VENDOR_REPORT_PAGE_SIZE } }

const VENDOR_REPORT_ORDER = [{ field: FileOrderField.created_at, direction: OrderDirection.DESC }]

const vendorReportWhere = (search: string): FileWhereInput => ({
  or: [{ detectedMimeType: PDF_MIME_TYPE }, { detectedContentType: PDF_MIME_TYPE }, { providedFileExtensionEqualFold: 'pdf' }, { providedFileExtensionEqualFold: '.pdf' }],
  ...(search ? { and: [{ or: [{ nameContainsFold: search }, { providedFileNameContainsFold: search }] }] } : {}),
})

type TVendorReportFileSelectProps = {
  vendorId: string
  onSelect: (report: TReportScanFile) => void
}

const VendorReportFileSelect = ({ vendorId, onSelect }: TVendorReportFileSelectProps) => {
  const { setSearchText, debouncedTerm, getIsSearching } = useAsyncCommandSearch()
  const {
    files,
    totalCount = 0,
    isFetching,
    isError,
  } = useGetEntityFilesPaginated({
    entityId: vendorId,
    where: vendorReportWhere(debouncedTerm),
    orderBy: VENDOR_REPORT_ORDER,
    pagination: VENDOR_REPORT_PAGINATION,
  })
  const isSearching = getIsSearching(isFetching)
  const items = files.map((file) => ({ id: file.id, name: getFileDisplayName(file) }))

  if (!debouncedTerm && !isFetching && !isError && totalCount === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold">Use a document already on this vendor</p>
      <SearchableItemSelect
        multiple={false}
        selectedIds={[]}
        onSelectedIdsChange={([fileId]) => {
          const file = items.find((item) => item.id === fileId)
          if (file) onSelect({ kind: 'existing', fileId: file.id, fileName: file.name })
        }}
        items={isSearching ? [] : items}
        isLoading={isSearching}
        icon={<FileText className="h-4 w-4" />}
        placeholder="Choose a PDF"
        searchPlaceholder={totalCount > items.length ? `Showing ${items.length} of ${totalCount} PDFs. Type to search...` : 'Search PDFs...'}
        emptyMessage={isError ? 'Could not load documents. Please try again later.' : 'No PDFs found.'}
        onSearchTextChange={setSearchText}
      />
      <p className="text-center text-xs text-muted-foreground">or upload a new report</p>
    </div>
  )
}

type TReportFileFieldProps = {
  value: TReportScanFile | null
  onChange: (report: TReportScanFile | null) => void
  uploadLabel: string
  vendorId?: string
}

export const ReportFileField = ({ value, onChange, uploadLabel, vendorId }: TReportFileFieldProps) => {
  if (value) {
    const name = value.kind === 'upload' ? value.file.name : value.fileName
    return (
      <Card className="@container flex items-center gap-3 p-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
          <FileText size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold" title={name}>
            {name}
          </p>
          <p className="truncate text-xs text-muted-foreground">{value.kind === 'upload' ? formatFileSize(value.file.size) : 'Uses the file already uploaded'}</p>
        </div>
        <Badge variant="outline" className="hidden shrink-0 border-primary/40 text-primary @xs:inline-flex">
          Ready
        </Badge>
        <Button variant="icon" size="icon" icon={<X size={16} />} onClick={() => onChange(null)} descriptiveTooltipText="Remove file" />
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {vendorId ? <VendorReportFileSelect vendorId={vendorId} onSelect={onChange} /> : null}
      <FileUpload
        acceptedFileTypes={pdfAcceptedFileTypes}
        acceptedFileTypesShort={pdfAcceptedFileTypesShort}
        maxFileSizeInMb={MAX_REPORT_SIZE_MB}
        multipleFiles={false}
        inputLabel={uploadLabel}
        onFileUpload={(uploaded) => onChange(uploaded.file ? { kind: 'upload', file: uploaded.file } : null)}
      />
    </div>
  )
}
