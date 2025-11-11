'use client'

import React, { useCallback, useContext, useEffect, useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { Loading } from '@/components/shared/loading/loading'
import { trustCenterDocsColumns, TTrustCenterDoc } from './table-config'
import { VisibilityState } from '@tanstack/react-table'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useGetTrustCenterDocs } from '@/lib/graphql-hooks/trust-center'
import DocumentsTableToolbar from './documents-table-toolbar'
import { CreateDocumentSheet } from './create-document.sheet'
import { TrustCenterDocWhereInput } from '@repo/codegen/src/schema'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { Button } from '@repo/ui/button'
import { File } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

const DocumentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({ createdAt: false })
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const [filters, setFilters] = useState<TrustCenterDocWhereInput | null>(null)
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

  const tableData =
    docs.map((doc) => ({
      id: doc?.id ?? '',
      title: doc?.title ?? '',
      category: doc?.category ?? '',
      visibility: doc?.visibility ?? '',
      tags: doc?.tags ?? [],
      createdAt: doc?.createdAt ?? '',
      updatedAt: doc?.updatedAt ?? '',
    })) ?? []

  const handleRowClick = (row: TTrustCenterDoc) => {
    router.push(`/trust-center/documents?id=${row.id}`)
  }

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Trust Center' }, { label: 'Reports & Certifications', href: '/trust-center/documents' }])
  }, [setCrumbs])

  if (isLoading) return <Loading />
  const hasData = tableData.length > 0

  return (
    <>
      <CreateDocumentSheet />
      {hasData ? (
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">Reports & Certifications</h2>
          <div className="flex items-center justify-between gap-2 mb-4">
            <DocumentsTableToolbar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              mappedColumns={trustCenterDocsColumns.map((col) => ({
                accessorKey: 'accessorKey' in col ? String(col.accessorKey) : '',
                header: typeof col.header === 'string' ? col.header : 'Column',
              }))}
              columnVisibility={columnVisibility}
              setColumnVisibility={setColumnVisibility}
              handleFilterChange={handleFilterChange}
            />
          </div>
          <DataTable
            columns={trustCenterDocsColumns}
            data={tableData}
            pagination={pagination}
            onPaginationChange={setPagination}
            paginationMeta={paginationMeta}
            loading={isLoading}
            columnVisibility={columnVisibility}
            onRowClick={handleRowClick}
          />
        </div>
      ) : (
        <Panel align="center" justify="center" textAlign="center" className="min-h-[300px]">
          <PanelHeader
            heading="Documents"
            subheading="You haven’t added any Trust Center documents yet.
Upload reports, certifications, or other materials you’d like customers to see when visiting your Trust Center."
          />{' '}
          <Link href="/trust-center/documents?create=true">
            <Button variant="primary" icon={<File size={16} strokeWidth={2} />} iconPosition="left">
              Upload Document
            </Button>
          </Link>
        </Panel>
      )}
    </>
  )
}

export default DocumentsPage
