'use client'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import GroupsTable from '@/components/pages/protected/groups/components/groups-table'
import { PlusCircle, SearchIcon } from 'lucide-react'
import { GetAllGroupsQueryVariables, GroupSettingVisibility, GroupWhereInput } from '@repo/codegen/src/schema'
import CreateGroupDialog from './components/dialogs/create-group-dialog'
import GroupDetailsSheet from './components/group-details-sheet'
import { Input } from '@repo/ui/input'
import { TableFilter } from '@/components/shared/table-filter/table-filter'
import { useSession } from 'next-auth/react'
import { useDebounce } from '@uidotdev/usehooks'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import GroupInfiniteCards from '@/components/pages/protected/groups/components/group-infinite-cards.tsx'
import { Button } from '@repo/ui/button'
import { VisibilityState } from '@tanstack/react-table'
import { getGroupTableColumns } from './table/columns'
import ColumnVisibilityMenu, { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import TableCardView from '@/components/shared/table-card-view/table-card-view'
import { canCreate } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { whereGenerator } from '@/components/shared/table-filter/where-generator'
import { TQuickFilter } from '@/components/shared/table-filter/table-filter-helper'
import { TFilterState } from '@/components/shared/table-filter/filter-storage'
import { useGroupsFilters } from './table/table-config'
import { getInitialPagination } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'

const GroupsPage = () => {
  const [activeTab, setActiveTab] = useState<'table' | 'card'>('table')
  const [whereFilters, setWhereFilters] = useState<GroupWhereInput | null>(null)
  const [orderBy, setOrderBy] = useState<GetAllGroupsQueryVariables['orderBy']>()
  const [searchQuery, setSearchQuery] = useState('')
  const { data: session } = useSession()
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [pagination, setPagination] = useState<TPagination>(getInitialPagination(TableKeyEnum.GROUP, DEFAULT_PAGINATION))
  const defaultVisibility: VisibilityState = {
    id: false,
    updatedAt: false,
    updatedBy: false,
    createdAt: false,
    createdBy: false,
  }

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableKeyEnum.GROUP, defaultVisibility))
  const { setCrumbs } = React.useContext(BreadcrumbContext)
  const { data: permissions } = useOrganizationRoles()
  const filterFields = useGroupsFilters()
  const quickFilters: TQuickFilter[] = useMemo(() => {
    return [
      {
        label: 'All Groups',
        key: 'allGroups',
        type: 'custom',
        getCondition: () =>
          ({
            or: [{ hasMembersWith: [{ userID: session?.user?.userId ?? '' }] }, { isManaged: true }],
          }) as TFilterState,
        isActive: false,
      },
      {
        label: 'My Groups',
        key: 'myGroups',
        type: 'custom',
        getCondition: () =>
          ({
            and: [{ hasMembersWith: [{ userID: session?.user?.userId ?? '' }] }],
          }) as TFilterState,
        isActive: false,
      },
      {
        label: 'System Managed Groups',
        key: 'systemManaged',
        type: 'custom',
        getCondition: () =>
          ({
            and: [{ isManaged: true }],
          }) as TFilterState,
        isActive: false,
      },
    ]
  }, [session?.user?.userId])

  const containsIsManaged = useCallback((cond: GroupWhereInput): boolean => {
    if (!cond || typeof cond !== 'object') return false
    if ('isManaged' in cond) return true

    if (cond.and?.some(containsIsManaged)) return true
    if (cond.or?.some(containsIsManaged)) return true
    return false
  }, [])

  const whereFilter = useMemo(() => {
    const mapCustomKey = (key: string, value: unknown): GroupWhereInput => {
      if (key === 'visibilityIn') {
        return {
          hasSettingWith: [
            {
              visibilityIn: value as GroupSettingVisibility[],
            },
          ],
        }
      }

      return { [key]: value } as GroupWhereInput
    }

    const baseWhere = whereGenerator<GroupWhereInput>(whereFilters, mapCustomKey)
    const includeSystemManaged = baseWhere?.and?.map((x) => x.isManaged).find((v) => v !== undefined)
    const andClauses = baseWhere?.and ?? []
    const extractedUserId = andClauses
      .flatMap((x) => x.hasMembersWith ?? [])
      .map((m) => m.userID)
      .find((id) => id !== undefined)
    const hasIsManagedFilter = containsIsManaged(baseWhere)
    if (includeSystemManaged) {
      if (extractedUserId) {
        return {
          and: [
            {
              hasMembersWith: [
                {
                  userID: extractedUserId ?? session?.user?.userId ?? '',
                },
              ],
            },
          ],
          nameContainsFold: debouncedSearchQuery,
        } as GroupWhereInput
      } else {
        return {
          nameContainsFold: debouncedSearchQuery,
        } as GroupWhereInput
      }
    }

    const conditions: GroupWhereInput = {
      ...baseWhere,
      nameContainsFold: debouncedSearchQuery,
      ...(hasIsManagedFilter ? {} : { isManaged: false }),
    }

    return conditions
  }, [whereFilters, debouncedSearchQuery, containsIsManaged, session?.user?.userId])

  const orderByFilter = useMemo(() => {
    return orderBy || undefined
  }, [orderBy])

  const { mappedColumns } = getGroupTableColumns({})

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'User Management' }, { label: 'Groups', href: '/user-management/groups' }])
  }, [setCrumbs])

  return (
    <>
      <PageHeading eyebrow="user management" heading={'Groups'} />
      <div className="flex items-center gap-2 my-2">
        <Input
          value={searchQuery}
          name="groupSearch"
          placeholder="Search..."
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          icon={<SearchIcon width={17} />}
          iconPosition="left"
          variant="searchTable"
        />
        <TableCardView activeTab={activeTab} onTabChange={setActiveTab}></TableCardView>
        <div className="grow flex flex-row items-center gap-2 justify-end">
          {mappedColumns && columnVisibility && setColumnVisibility && (
            <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} storageKey={TableKeyEnum.GROUP} />
          )}
          {filterFields && filterFields.length > 0 && <TableFilter filterFields={filterFields} onFilterChange={setWhereFilters} pageKey={TableKeyEnum.GROUP} quickFilters={quickFilters} />}
          {canCreate(permissions?.roles, AccessEnum.CanCreateGroup) && (
            <CreateGroupDialog
              trigger={
                <Button className="h-8 !px-2" icon={<PlusCircle />} iconPosition="left">
                  Create
                </Button>
              }
            />
          )}
        </div>
      </div>

      {activeTab === 'table' ? (
        <GroupsTable
          key="table"
          onSortChange={setOrderBy}
          whereFilter={whereFilter}
          orderByFilter={orderByFilter}
          pagination={pagination}
          onPaginationChange={(pagination: TPagination) => setPagination(pagination)}
          columnVisibility={columnVisibility}
          setColumnVisibility={setColumnVisibility}
        />
      ) : (
        <GroupInfiniteCards whereFilter={whereFilter} orderByFilter={orderByFilter} />
      )}

      <GroupDetailsSheet />
    </>
  )
}

export default GroupsPage
