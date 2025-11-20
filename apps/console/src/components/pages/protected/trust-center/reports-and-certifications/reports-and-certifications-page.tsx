'use client'

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DataTable, getInitialPagination } from '@repo/ui/data-table'
import { Loading } from '@/components/shared/loading/loading'
import { VisibilityState } from '@tanstack/react-table'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useGetTrustCenterDocs } from '@/lib/graphql-hooks/trust-center'
import { CreateDocumentSheet } from './sheet/create-document.sheet'
import { TrustCenterDocWhereInput } from '@repo/codegen/src/schema'
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

const ReportsAndCertificationsPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableColumnVisibilityKeysEnum.DOCUMENTS, { createdAt: false }))
  const [pagination, setPagination] = useState<TPagination>(getInitialPagination(TableKeyEnum.TRUST_CENTER_REPORTS_AND_CERTS, DEFAULT_PAGINATION))
  const [filters, setFilters] = useState<TrustCenterDocWhereInput | null>(null)
  const [selectedDocs, setSelectedDocs] = useState<{ id: string }[]>([])
  const router = useRouter()
  const { setCrumbs } = useContext(BreadcrumbContext)

  const { docs, paginationMeta, isLoading } = useGetTrustCenterDocs({
    where: {
      ...(searchTerm ? { titleContainsFold: searchTerm } : {}),
      ...(filters ?? {}),
    },
    pagination,
  })

  const handleFilterChange = useCallback((newFilters: TrustCenterDocWhereInput) => {
    setFilters(newFilters)
    setPagination(DEFAULT_PAGINATION)
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
      })) ?? [],
    [docs],
  )

  const { columns, mappedColumns } = useMemo(() => getTrustCenterDocColumns({ selectedDocs, setSelectedDocs }), [selectedDocs])

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Trust Center' }, { label: 'Reports & Certifications', href: '/trust-center/reports-and-certifications' }])
  }, [setCrumbs])

  if (isLoading) return <Loading />

  const areFiltersAndSearchTurnedOff = !searchTerm && filters && !Object.keys(filters).length
  const showCreatePanel = areFiltersAndSearchTurnedOff && tableData.length === 0

  return (
    <>
      <CreateDocumentSheet />

      {showCreatePanel ? (
        <Panel align="center" justify="center" textAlign="center" className="min-h-[300px]">
          <PanelHeader
            heading="Documents"
            subheading="You haven't added any Trust Center documents yet. Upload reports, certifications, or other materials you'd like customers to see when visiting your Trust Center."
          />
          <Link href="/trust-center/reports-and-certifications?create=true">
            <Button variant="primary" icon={<File size={16} strokeWidth={2} />} iconPosition="left">
              Upload Document
            </Button>
          </Link>
        </Panel>
      ) : (
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Reports & Certifications</h2>
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
            onRowClick={(row) => router.push(`/trust-center/reports-and-certifications?id=${row.id}`)}
            tableKey={TableKeyEnum.TRUST_CENTER_REPORTS_AND_CERTS}
          />
        </div>
      )}
    </>
  )
}

export default ReportsAndCertificationsPage
