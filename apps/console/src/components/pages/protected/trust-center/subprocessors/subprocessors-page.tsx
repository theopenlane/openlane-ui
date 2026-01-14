'use client'

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { Loading } from '@/components/shared/loading/loading'
import { VisibilityState } from '@tanstack/react-table'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useGetTrustCenterSubprocessors } from '@/lib/graphql-hooks/trust-center-subprocessors'
import { TrustCenterSubprocessorWhereInput, User } from '@repo/codegen/src/schema'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import SubprocessorsTableToolbar from './table/subprocessors-table-toolbar'
import { getSubprocessorsColumns, SubprocessorTableItem } from './table/table-config'
import { useGetOrgUserList } from '@/lib/graphql-hooks/members'
import { TableKeyEnum } from '@repo/ui/table-key'
import { SearchKeyEnum, useStorageSearch } from '@/hooks/useStorageSearch'
import { EditTrustCenterSubprocessorSheet } from './sheet/eidt-trust-center-subprocessor-sheet'
import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import ProtectedArea from '@/components/shared/protected-area/protected-area'

const SubprocessorsPage = () => {
  const [searchTerm, setSearchTerm] = useStorageSearch(SearchKeyEnum.SUBPROCESSORS)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    id: false,
    createdBy: false,
    updatedAt: false,
    updatedVy: false,
    createdAt: false,
  })
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const [filters, setFilters] = useState<TrustCenterSubprocessorWhereInput | null>(null)
  const [selectedRows, setSelectedRows] = useState<{ id: string }[]>([])
  const { data } = useGetTrustCenter()
  const trustCenter = data?.trustCenters?.edges?.[0]?.node
  const { setCrumbs } = useContext(BreadcrumbContext)

  const { trustCenterSubprocessors, paginationMeta, isLoading } = useGetTrustCenterSubprocessors({
    where: {
      ...(searchTerm ? { hasSubprocessorWith: [{ or: [{ nameContainsFold: searchTerm }, { descriptionContainsFold: searchTerm }] }] } : {}),
      ...(filters ?? {}),
    },
    pagination,
  })

  const userIds = useMemo(() => {
    if (!trustCenterSubprocessors) return []
    const ids = new Set<string>()
    trustCenterSubprocessors.forEach((item) => {
      if (item?.createdBy) ids.add(item?.createdBy)
      if (item?.updatedBy) ids.add(item?.updatedBy)
    })
    return Array.from(ids)
  }, [trustCenterSubprocessors])

  const { users } = useGetOrgUserList({
    where: { hasUserWith: [{ idIn: userIds }] },
  })

  const handleFilterChange = useCallback((newFilters: TrustCenterSubprocessorWhereInput) => {
    setFilters(newFilters)
    setPagination(DEFAULT_PAGINATION)
  }, [])

  const userMap = useMemo(() => {
    const map: Record<string, User> = {}
    users?.forEach((u) => {
      map[u.id] = u
    })
    return map
  }, [users])

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

  const { columns, mappedColumns } = useMemo(() => getSubprocessorsColumns({ selectedRows, setSelectedRows, userMap }), [selectedRows, userMap])

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Trust Center' }, { label: 'Subprocessors', href: '/trust-center/subprocessors' }])
  }, [setCrumbs])

  if (isLoading) return <Loading />

  if (!trustCenter) {
    return <ProtectedArea />
  }

  return (
    <>
      <EditTrustCenterSubprocessorSheet />
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
          tableKey={TableKeyEnum.TRUST_CENTER_SUBPROCESSORS}
        />
      </div>
    </>
  )
}

export default SubprocessorsPage
