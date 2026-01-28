'use client'

import { DataTable } from '@repo/ui/data-table'
import React, { forwardRef, useEffect, useImperativeHandle, useMemo } from 'react'
import { OrderDirection, AssetOrder, AssetWhereInput } from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { getAssetColumns } from '@/components/pages/protected/assets/table/columns.tsx'
import { ASSETS_SORT_FIELDS } from '@/components/pages/protected/assets/table/table-config.ts'
import { useAssetsWithFilter } from '@/lib/graphql-hooks/assets.ts'
import { useGetOrgUserList } from '@/lib/graphql-hooks/members.ts'
import { VisibilityState } from '@tanstack/react-table'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { TAccessRole, TData } from '@/types/authz'
import { useNotification } from '@/hooks/useNotification'
import { TableKeyEnum } from '@repo/ui/table-key'

type TAssetsTableProps = {
  onSortChange?: (sortCondition: AssetOrder[] | AssetOrder | undefined) => void
  pagination: TPagination
  onPaginationChange: (pagination: TPagination) => void
  whereFilter: AssetWhereInput | null
  orderByFilter: AssetOrder[] | AssetOrder | undefined
  columnVisibility?: VisibilityState
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>
  onHasAssetsChange?: (hasAssets: boolean) => void
  selectedAssets: { id: string }[]
  setSelectedAssets: React.Dispatch<React.SetStateAction<{ id: string }[]>>
  canEdit: (accessRole: TAccessRole[] | undefined) => boolean
  permission: TData | undefined
  defaultSorting: { field: string; direction?: OrderDirection }[] | undefined
}

const AssetsTable = forwardRef(
  (
    {
      onSortChange,
      pagination,
      onPaginationChange,
      whereFilter,
      orderByFilter,
      columnVisibility,
      setColumnVisibility,
      onHasAssetsChange,
      selectedAssets,
      setSelectedAssets,
      canEdit,
      permission,
      defaultSorting,
    }: TAssetsTableProps,
    ref,
  ) => {
    const { replace } = useSmartRouter()
    const {
      Assets: assets,
      isLoading: fetching,
      data,
      isFetching,
      isError,
    } = useAssetsWithFilter({
      where: whereFilter,
      orderBy: orderByFilter,
      pagination,
      enabled: true,
    })

    const { convertToReadOnly } = usePlateEditor()
    const { errorNotification } = useNotification()
    const userIds = useMemo(() => {
      if (!assets) return []
      const ids = new Set<string>()
      assets.forEach((asset) => {
        if (asset.createdBy) ids.add(asset.createdBy)
        if (asset.updatedBy) ids.add(asset.updatedBy)
      })
      return Array.from(ids)
    }, [assets])

    const hasAssets = useMemo(() => {
      return assets && assets.length > 0
    }, [assets])

    useEffect(() => {
      if (onHasAssetsChange) {
        onHasAssetsChange(hasAssets)
      }
    }, [hasAssets, onHasAssetsChange])

    useEffect(() => {
      if (permission?.roles) {
        setColumnVisibility((prev) => ({
          ...prev,
          select: canEdit(permission.roles),
        }))
      }
    }, [permission?.roles, setColumnVisibility, canEdit])

    useEffect(() => {
      if (isError) {
        errorNotification({
          title: 'Error',
          description: 'Failed to load assets',
        })
      }
    }, [isError, errorNotification])

    const { users, isFetching: fetchingUsers } = useGetOrgUserList({
      where: { hasUserWith: [{ idIn: userIds }] },
    })

    const userMap = useMemo(() => {
      const map: Record<string, (typeof users)[0]> = {}
      users?.forEach((u) => {
        map[u.id] = u
      })
      return map
    }, [users])

    useImperativeHandle(ref, () => ({
      exportData: () => assets,
    }))

    const columns = useMemo(() => getAssetColumns({ userMap, convertToReadOnly, selectedAssets, setSelectedAssets }), [userMap, convertToReadOnly, selectedAssets, setSelectedAssets])

    return (
      <DataTable
        columns={columns}
        sortFields={ASSETS_SORT_FIELDS}
        onSortChange={onSortChange}
        data={assets}
        loading={fetching || fetchingUsers}
        defaultSorting={defaultSorting}
        onRowClick={(asset) => {
          replace({ id: asset.id })
        }}
        pagination={pagination}
        onPaginationChange={onPaginationChange}
        paginationMeta={{
          totalCount: data?.assets.totalCount,
          pageInfo: data?.assets?.pageInfo,
          isLoading: isFetching,
        }}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        tableKey={TableKeyEnum.ASSET}
      />
    )
  },
)

AssetsTable.displayName = 'AssetsTable'
export default AssetsTable
