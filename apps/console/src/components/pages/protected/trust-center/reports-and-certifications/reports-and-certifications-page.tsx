'use client'

import React, { useCallback, use, useEffect, useMemo, useState } from 'react'
import { DataTable, getInitialPagination } from '@repo/ui/data-table'
import { Loading } from '@/components/shared/loading/loading'
import { type VisibilityState } from '@tanstack/react-table'
import { type TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useGetTrustCenterDocs } from '@/lib/graphql-hooks/trust-center-doc'
import { useGetTrustCenterNDAFiles } from '@/lib/graphql-hooks/trust-center-nda-request'
import { CreateDocumentSheet } from './sheet/create-document.sheet'
import { TrustCenterDocWatermarkStatus, type TrustCenterDocWhereInput } from '@repo/codegen/src/schema'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { useRouter } from 'next/navigation'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import DocumentsTableToolbar from './table/documents-table-toolbar'
import { getTrustCenterDocColumns } from './table/table-config'
import { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu.tsx'
import { TableKeyEnum } from '@repo/ui/table-key'
import { useStorageSearch } from '@/hooks/useStorageSearch'
import { whereGenerator } from '@/components/shared/table-filter/where-generator'
import { ObjectTypes } from '@repo/codegen/src/type-names'

const ReportsAndCertificationsPage = () => {
  const [searchTerm, setSearchTerm] = useStorageSearch(ObjectTypes.TRUST_CENTER_DOC)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableKeyEnum.DOCUMENTS, { createdAt: false, updatedAt: false }))
  const [pagination, setPagination] = useState<TPagination>(() => getInitialPagination(TableKeyEnum.TRUST_CENTER_REPORTS_AND_CERTS, DEFAULT_PAGINATION))
  const [filters, setFilters] = useState<TrustCenterDocWhereInput | null>(null)
  const [selectedDocs, setSelectedDocs] = useState<{ id: string }[]>([])
  const router = useRouter()
  const { setCrumbs } = use(BreadcrumbContext)
  const whereFilter = useMemo(() => {
    const base: TrustCenterDocWhereInput = {}

    const result = whereGenerator<TrustCenterDocWhereInput>(filters, (key, value) => {
      if (key === 'hasStandardWith') {
        return {
          hasStandardWith: [
            {
              shortNameContainsFold: value as string,
            },
          ],
        } as TrustCenterDocWhereInput
      }

      return { [key]: value } as TrustCenterDocWhereInput
    })

    return { ...base, ...result }
  }, [filters])

  const { docs, paginationMeta, isLoading } = useGetTrustCenterDocs({
    where: {
      ...(searchTerm ? { titleContainsFold: searchTerm } : {}),
      ...whereFilter,
    },
    pagination,
  })
  const { latestFile: latestNdaFile } = useGetTrustCenterNDAFiles()
  const hasNdaTemplate = Boolean(latestNdaFile)
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
        category: doc?.trustCenterDocKindName ?? '',
        visibility: doc?.visibility ?? '',
        tags: doc?.tags ?? [],
        createdAt: doc?.createdAt ?? '',
        updatedAt: doc?.updatedAt ?? '',
        watermarkingEnabled: doc?.watermarkingEnabled ?? false,
        file: doc?.file ? { presignedURL: doc.file.presignedURL } : null,
        originalFile: doc?.originalFile ? { presignedURL: doc.originalFile.presignedURL } : null,
        watermarkStatus: doc?.watermarkStatus ?? TrustCenterDocWatermarkStatus.DISABLED,
        standardShortName: doc?.standard?.shortName ?? '',
      })) ?? [],
    [docs],
  )

  const { columns, mappedColumns } = useMemo(() => getTrustCenterDocColumns({ selectedDocs, setSelectedDocs, hasNdaTemplate }), [selectedDocs, hasNdaTemplate])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Trust Center', href: '/trust-center/overview' },
      { label: 'Documents', href: '/trust-center/reports-and-certifications' },
    ])
  }, [setCrumbs])

  if (isLoading) return <Loading />

  const areFiltersAndSearchTurnedOff = !searchTerm && filters && !Object.keys(filters).length
  const showCreatePanel = areFiltersAndSearchTurnedOff && tableData.length === 0

  return (
    <>
      <CreateDocumentSheet />

      {showCreatePanel && (
        <Panel align="center" justify="center" textAlign="left" className="mb-4 pt-10">
          <PanelHeader
            className="border-0"
            heading="Add Documents to Your Trust Center"
            subheading={
              <div className="space-y-3 text-sm">
                <p className="text-sm text-muted-foreground">
                  Share security reports, certifications, and policies to help customers evaluate your security posture. Documents can be shared publicly or securely behind an NDA.
                </p>
                <hr className="border-border" />
                <p className="font-medium">Common documents:</p>
                <div className="flex flex-wrap gap-2">
                  {['SOC 2 Report', 'Pen Test', 'Security Overview', 'DPA'].map((doc) => (
                    <span key={doc} className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
                      {doc}
                    </span>
                  ))}
                </div>
              </div>
            }
          />
        </Panel>
      )}

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
    </>
  )
}

export default ReportsAndCertificationsPage
