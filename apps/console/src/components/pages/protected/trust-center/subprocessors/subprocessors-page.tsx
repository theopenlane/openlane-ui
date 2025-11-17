'use client'

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { Loading } from '@/components/shared/loading/loading'
import { VisibilityState } from '@tanstack/react-table'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useGetSubprocessors } from '@/lib/graphql-hooks/trust-center-subprocessors'
import { SubprocessorWhereInput } from '@repo/codegen/src/schema'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { Button } from '@repo/ui/button'
import { Building2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import SubprocessorsTableToolbar from './table/subprocessors-table-toolbar'
import { getSubprocessorsColumns, SubprocessorTableItem } from './table/table-config'
import { CreateSubprocessorSheet } from './sheet/create-subprocessor-sheet'

const SubprocessorsPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({ id: false, createdBy: false, updatedAt: false })
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const [filters, setFilters] = useState<SubprocessorWhereInput | null>(null)
  const [selectedRows, setSelectedRows] = useState<{ id: string }[]>([])

  const router = useRouter()
  const { setCrumbs } = useContext(BreadcrumbContext)

  const { subprocessors, paginationMeta, isLoading } = useGetSubprocessors({
    where: {
      ...(searchTerm ? { nameContainsFold: searchTerm } : {}),
      ...(filters ?? {}),
    },
    pagination,
  })

  const handleFilterChange = useCallback((newFilters: SubprocessorWhereInput) => {
    setFilters(newFilters)
    setPagination(DEFAULT_PAGINATION)
  }, [])

  const tableData: SubprocessorTableItem[] = useMemo(
    () =>
      subprocessors.map((item) => ({
        id: item?.id ?? '',
        name: item?.name ?? '',
        description: item?.description ?? '',
        logo: item?.logoFile?.presignedURL ?? item?.logoRemoteURL ?? null,
      })) ?? [],
    [subprocessors],
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
      <CreateSubprocessorSheet />
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
