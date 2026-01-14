'use client'

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DataTable, getInitialPagination } from '@repo/ui/data-table'
import { Loading } from '@/components/shared/loading/loading'
import { VisibilityState } from '@tanstack/react-table'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useGetTrustCenterDocs } from '@/lib/graphql-hooks/trust-center'
import { CreateDocumentSheet } from './sheet/create-document.sheet'
import { TrustCenterDocWatermarkStatus, TrustCenterDocWhereInput } from '@repo/codegen/src/schema'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { Button } from '@repo/ui/button'
import { File } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import DocumentsTableToolbar from './table/documents-table-toolbar'
import { getTrustCenterDocColumns } from './table/table-config'
import { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu.tsx'
import { TableColumnVisibilityKeysEnum } from '@/components/shared/table-column-visibility/table-column-visibility-keys.ts'
import { TableKeyEnum } from '@repo/ui/table-key'
import { SearchKeyEnum, useStorageSearch } from '@/hooks/useStorageSearch'
import { canCreate } from '@/lib/authz/utils'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { AccessEnum } from '@/lib/authz/enums/access-enum'

const ReportsAndCertificationsPage = () => {
  const [searchTerm, setSearchTerm] = useStorageSearch(SearchKeyEnum.DOCUMENTS)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableColumnVisibilityKeysEnum.DOCUMENTS, { createdAt: false, updatedAt: false }))
  const [pagination, setPagination] = useState<TPagination>(getInitialPagination(TableKeyEnum.TRUST_CENTER_REPORTS_AND_CERTS, DEFAULT_PAGINATION))
  const [filters, setFilters] = useState<TrustCenterDocWhereInput | null>(null)
  const [selectedDocs, setSelectedDocs] = useState<{ id: string }[]>([])
  const router = useRouter()
  const { setCrumbs } = useContext(BreadcrumbContext)
  const { data: orgPermission } = useOrganizationRoles()

  const canCreateAllowed = canCreate(orgPermission?.roles, AccessEnum.CanCreateTrustCenterDocument)
  const { docs, paginationMeta, isLoading, error } = useGetTrustCenterDocs({
    where: {
      ...(searchTerm ? { titleContainsFold: searchTerm } : {}),
      ...(filters ?? {}),
    },
    pagination,
  })
  const handleFilterChange = useCallback((newFilters: TrustCenterDocWhereInput) => {
    setFilters(newFilters)
    setPagination((prev) => ({
      ...prev,
      pageIndex: 0,
    }))
  }, [])

  const tableData = useMemo(
    () =>
      docs.map((doc) => ({
        id: doc?.id ?? '',
        title: doc?.title ?? '',
        category: doc?.category ?? '',
        visibility: doc?.visibility ?? '',
        tags: doc?.tags ?? [],
        createdAt: doc?.createdAt ?? '',
        updatedAt: doc?.updatedAt ?? '',
        watermarkingEnabled: doc?.watermarkingEnabled ?? false,
        file: doc?.file ? { presignedURL: doc.file.presignedURL } : null,
        originalFile: doc?.originalFile ? { presignedURL: doc.originalFile.presignedURL } : null,
        watermarkStatus: doc?.watermarkStatus ?? TrustCenterDocWatermarkStatus.DISABLED,
      })) ?? [],
    [docs],
  )

  const { columns, mappedColumns } = useMemo(() => getTrustCenterDocColumns({ selectedDocs, setSelectedDocs }), [selectedDocs])

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Trust Center' }, { label: 'Documents', href: '/trust-center/reports-and-certifications' }])
  }, [setCrumbs])

  if (isLoading) return <Loading />

  if (error) {
    return <div className="p-6 text-red-600">Failed to load trust center documents: {error.message}</div>
  }

  const areFiltersAndSearchTurnedOff = !searchTerm && filters && !Object.keys(filters).length
  const showCreatePanel = areFiltersAndSearchTurnedOff && tableData.length === 0

  return (
    <>
      <CreateDocumentSheet />

      {showCreatePanel ? (
        <Panel align="center" justify="center" textAlign="center" className="min-h-[300px]">
          <PanelHeader
            heading="Documents"
            subheading={
              canCreateAllowed
                ? "You haven't added any Trust Center documents yet. Upload reports, certifications, or other materials you'd like customers to see when visiting your Trust Center."
                : "Unfortunately, you don't have permission to upload documents."
            }
          />
          {canCreateAllowed && (
            <Link href="/trust-center/reports-and-certifications?create=true">
              <Button variant="primary" icon={<File size={16} strokeWidth={2} />} iconPosition="left">
                Upload Document
              </Button>
            </Link>
          )}
        </Panel>
      ) : (
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Documents</h2>
          </div>

          <DocumentsTableToolbar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            mappedColumns={mappedColumns}
            columnVisibility={columnVisibility}
            setColumnVisibility={setColumnVisibility}
            handleFilterChange={handleFilterChange}
            selectedDocs={selectedDocs}
            setSelectedDocs={setSelectedDocs}
          />

          <DataTable
            columns={columns}
            data={tableData}
            pagination={pagination}
            onPaginationChange={setPagination}
            paginationMeta={paginationMeta}
            loading={isLoading}
            columnVisibility={columnVisibility}
            onRowClick={(row) => {
              router.push(`/trust-center/reports-and-certifications?id=${row.id}`)
            }}
            tableKey={TableKeyEnum.TRUST_CENTER_REPORTS_AND_CERTS}
          />
        </div>
      )}
    </>
  )
}

export default ReportsAndCertificationsPage
