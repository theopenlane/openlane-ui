'use client'

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { Loading } from '@/components/shared/loading/loading'
import { VisibilityState } from '@tanstack/react-table'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useGetTrustCenterSubprocessors } from '@/lib/graphql-hooks/trust-center-subprocessors'
import { TrustCenterSubprocessorWhereInput } from '@repo/codegen/src/schema'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { Button } from '@repo/ui/button'
import { Building2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import SubprocessorsTableToolbar from './table/subprocessors-table-toolbar'
import { getSubprocessorsColumns, SubprocessorTableItem } from './table/table-config'
import { CreateTrustCenterSubprocessorSheet } from './sheet/create-trust-center-subprocessor-sheet'

const SubprocessorsPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    id: false,
    createdBy: false,
    updatedAt: false,
  })
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const [filters, setFilters] = useState<TrustCenterSubprocessorWhereInput | null>(null)
  const [selectedRows, setSelectedRows] = useState<{ id: string }[]>([])

  const router = useRouter()
  const { setCrumbs } = useContext(BreadcrumbContext)

  const { trustCenterSubprocessors, paginationMeta, isLoading } = useGetTrustCenterSubprocessors({
    where: {
      ...(searchTerm ? { subprocessor: { nameContainsFold: searchTerm } } : {}),
      ...(filters ?? {}),
    },
    pagination,
  })

  const handleFilterChange = useCallback((newFilters: TrustCenterSubprocessorWhereInput) => {
    setFilters(newFilters)
    setPagination(DEFAULT_PAGINATION)
  }, [])

  const tableData: SubprocessorTableItem[] = useMemo(
    () =>
      trustCenterSubprocessors.map((item) => ({
        id: item?.id ?? '',
        name: item?.subprocessor?.name ?? '',
        description: item?.subprocessor?.description ?? '',
        logo: item?.subprocessor?.logoFile?.presignedURL ?? item?.subprocessor?.logoRemoteURL ?? null,
        category: item?.category ?? '',
        countries: item?.countries ?? [],
        createdAt: item?.createdAt ?? null,
        createdBy: item?.createdBy ?? null,
        updatedAt: item?.updatedAt ?? null,
        updatedBy: item?.updatedBy ?? null,
      })) ?? [],
    [trustCenterSubprocessors],
  )

  const { columns, mappedColumns } = useMemo(() => getSubprocessorsColumns({ selectedRows, setSelectedRows }), [selectedRows])

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Trust Center' }, { label: 'Subprocessors', href: '/trust-center/subprocessors' }])
  }, [setCrumbs])

  if (isLoading) return <Loading />

  const areFiltersOff = !searchTerm && filters && !Object.keys(filters).length
  const showCreatePanel = areFiltersOff && tableData.length === 0

  return (
    <>
      <CreateTrustCenterSubprocessorSheet />

      {showCreatePanel ? (
        <Panel align="center" justify="center" textAlign="center" className="min-h-[300px]">
          <PanelHeader heading="Subprocessors" subheading="You haven't added any subprocessors yet. Add third-party vendors that process customer data on your behalf." />
          <Link href="/trust-center/subprocessors?create=true">
            <Button variant="primary" icon={<Building2 size={16} />} iconPosition="left">
              Add Subprocessor
            </Button>
          </Link>
        </Panel>
      ) : (
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Subprocessors</h2>
          </div>

          <SubprocessorsTableToolbar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            mappedColumns={mappedColumns}
            columnVisibility={columnVisibility}
            setColumnVisibility={setColumnVisibility}
            handleFilterChange={handleFilterChange}
            selectedRows={selectedRows}
            setSelectedRows={setSelectedRows}
          />

          <DataTable
            columns={columns}
            data={tableData}
            pagination={pagination}
            onPaginationChange={setPagination}
            paginationMeta={paginationMeta}
            loading={isLoading}
            columnVisibility={columnVisibility}
            onRowClick={(row) => router.push(`/trust-center/subprocessors?id=${row.id}`)}
          />
        </div>
      )}
    </>
  )
}

export default SubprocessorsPage
