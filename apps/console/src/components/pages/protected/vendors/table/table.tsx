'use client'

import { DataTable } from '@repo/ui/data-table'
import React, { forwardRef, useEffect, useImperativeHandle, useMemo } from 'react'
import { OrderDirection, EntityOrder, EntityWhereInput } from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { getVendorColumns } from './columns'
import { useEntitiesWithFilter } from '@/lib/graphql-hooks/entity'
import { useGetOrgUserList } from '@/lib/graphql-hooks/member'
import { VisibilityState } from '@tanstack/react-table'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { TAccessRole, TPermissionData } from '@/types/authz'
import { useNotification } from '@/hooks/useNotification'
import { TableKeyEnum } from '@repo/ui/table-key'
import { VENDORS_SORT_FIELDS } from './table-config'

type TVendorsTableProps = {
  onSortChange?: (sortCondition: EntityOrder[] | EntityOrder | undefined) => void
  pagination: TPagination
  onPaginationChange: (pagination: TPagination) => void
  whereFilter: EntityWhereInput | null
  orderByFilter: EntityOrder[] | EntityOrder | undefined
  columnVisibility?: VisibilityState
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>
  onHasVendorsChange?: (hasVendors: boolean) => void
  selectedVendors: { id: string }[]
  setSelectedVendors: React.Dispatch<React.SetStateAction<{ id: string }[]>>
  canEdit: (accessRole: TAccessRole[] | undefined) => boolean
  permission: TPermissionData | undefined
  defaultSorting: { field: string; direction?: OrderDirection }[] | undefined
}

const VendorsTable = forwardRef(
  (
    {
      onSortChange,
      pagination,
      onPaginationChange,
      whereFilter,
      orderByFilter,
      columnVisibility,
      setColumnVisibility,
      onHasVendorsChange,
      selectedVendors,
      setSelectedVendors,
      canEdit,
      permission,
      defaultSorting,
    }: TVendorsTableProps,
    ref,
  ) => {
    const { replace } = useSmartRouter()

    const vendorWhereFilter: EntityWhereInput = {
      ...whereFilter,
      hasEntityTypeWith: [{ name: 'vendor' }],
    }

    const {
      Entities: vendors,
      isLoading: fetching,
      data,
      isFetching,
      isError,
    } = useEntitiesWithFilter({
      where: vendorWhereFilter,
      orderBy: orderByFilter,
      pagination,
      enabled: true,
    })

    const { convertToReadOnly } = usePlateEditor()
    const { errorNotification } = useNotification()

    const userIds = useMemo(() => {
      if (!vendors) return []
      const ids = new Set<string>()
      vendors.forEach((entity) => {
        if (entity.createdBy) ids.add(entity.createdBy)
        if (entity.updatedBy) ids.add(entity.updatedBy)
      })
      return Array.from(ids)
    }, [vendors])

    const hasVendors = useMemo(() => {
      return vendors && vendors.length > 0
    }, [vendors])

    useEffect(() => {
      if (onHasVendorsChange) {
        onHasVendorsChange(hasVendors)
      }
    }, [hasVendors, onHasVendorsChange])

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
          description: 'Failed to load vendors',
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
      exportData: () => vendors,
    }))

    const columns = useMemo(() => getVendorColumns({ userMap, convertToReadOnly, selectedVendors, setSelectedVendors }), [userMap, convertToReadOnly, selectedVendors, setSelectedVendors])

    return (
      <DataTable
        columns={columns}
        sortFields={VENDORS_SORT_FIELDS}
        onSortChange={onSortChange}
        data={vendors}
        loading={fetching || fetchingUsers}
        defaultSorting={defaultSorting}
        onRowClick={(entity) => {
          replace({ id: entity.id })
        }}
        pagination={pagination}
        onPaginationChange={onPaginationChange}
        paginationMeta={{
          totalCount: data?.entities.totalCount,
          pageInfo: data?.entities?.pageInfo,
          isLoading: isFetching,
        }}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        tableKey={TableKeyEnum.ENTITY}
      />
    )
  },
)

VendorsTable.displayName = 'VendorsTable'

export default VendorsTable
