import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { DataTable } from '@repo/ui/data-table'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useGetSingleOrganizationMembers } from '@/lib/graphql-hooks/organization'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enums'
import { useDocumentationTasks } from '@/lib/graphql-hooks/documentation'
import type { TaskOrder, TaskWhereInput } from '@repo/codegen/src/schema'
import { OrderDirection, TaskOrderField, TaskTaskStatus } from '@repo/codegen/src/schema'
import { whereGenerator } from '@/components/shared/table-filter/where-generator'
import { buildAssociationFilter, mergeWhere, SearchFilterBar } from '@/components/pages/protected/controls/tabs/shared/documentation-shared'
import type { TPagination } from '@repo/ui/pagination-types'
import type { FilterField, WhereCondition } from '@/types'
import type { TOrgMembers } from '@/components/pages/protected/tasks/hooks/useTaskStore'
import { useSession } from 'next-auth/react'
import { getActivityTaskColumns, getActivityTaskFilterFields, type ActivityTaskRow } from './activity-tasks-config'

type ActivityTasksSectionProps = {
  controlId?: string
  subcontrolIds: string[]
}

const ActivityTasksSection: React.FC<ActivityTasksSectionProps> = ({ controlId, subcontrolIds }) => {
  const { data: session } = useSession()
  const associationFilter = useMemo(() => buildAssociationFilter(controlId, subcontrolIds), [controlId, subcontrolIds])

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [filters, setFilters] = useState<WhereCondition>({})
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const [orgMembers, setOrgMembers] = useState<TOrgMembers[]>([])
  const [filterFields, setFilterFields] = useState<FilterField[] | undefined>(undefined)

  const { data: membersData } = useGetSingleOrganizationMembers({ organizationId: session?.user.activeOrganizationId })
  const { enumOptions: taskKindOptions, isSuccess: taskKindsReady } = useGetCustomTypeEnums({
    where: {
      objectType: 'task',
      field: 'kind',
    },
  })

  useEffect(() => {
    const members =
      membersData?.organization?.members?.edges?.map(
        (member) =>
          ({
            value: member?.node?.user?.id,
            label: `${member?.node?.user?.displayName}`,
            membershipId: member?.node?.user?.id,
          }) as TOrgMembers,
      ) ?? []
    setOrgMembers(members)
  }, [membersData])

  useEffect(() => {
    if (!taskKindsReady) return
    const fields = getActivityTaskFilterFields(taskKindOptions ?? [], orgMembers)
    setFilterFields((prev) => {
      const isSame = prev && JSON.stringify(prev) === JSON.stringify(fields)
      return isSame ? prev : fields
    })
  }, [orgMembers, taskKindOptions, taskKindsReady])

  const where = useMemo(() => {
    const defaultStatuses = Object.values(TaskTaskStatus).filter((status) => status !== TaskTaskStatus.COMPLETED)
    let statusInSet = false

    const base: TaskWhereInput = {
      titleContainsFold: debouncedSearch,
    }

    const result = whereGenerator<TaskWhereInput>(filters as TaskWhereInput, (key, value) => {
      if (key === 'statusIn') {
        statusInSet = true
      }
      return { [key]: value } as TaskWhereInput
    })

    const withDefaults = {
      ...base,
      ...(!statusInSet && { statusIn: defaultStatuses }),
      ...result,
    }

    return mergeWhere<TaskWhereInput>([associationFilter as TaskWhereInput, withDefaults])
  }, [filters, debouncedSearch, associationFilter])

  const orderBy = useMemo<TaskOrder[]>(() => [{ field: TaskOrderField.updated_at, direction: OrderDirection.DESC }], [])

  const { tasks, paginationMeta, isLoading } = useDocumentationTasks({
    where,
    orderBy,
    pagination,
    enabled: true,
  })

  const handleFilterChange = useCallback((nextFilters: WhereCondition) => {
    setFilters(nextFilters)
    setPagination(DEFAULT_PAGINATION)
  }, [])

  const columns = useMemo(() => getActivityTaskColumns(taskKindOptions ?? []), [taskKindOptions])

  return (
    <div className="space-y-3">
      <SearchFilterBar
        placeholder="Search tasks"
        isSearching={search !== debouncedSearch}
        searchValue={search}
        onSearchChange={setSearch}
        filterFields={filterFields}
        onFilterChange={handleFilterChange}
      />
      <DataTable<ActivityTaskRow, unknown>
        columns={columns}
        data={tasks as ActivityTaskRow[]}
        loading={isLoading}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={paginationMeta}
        tableKey={undefined}
      />
    </div>
  )
}

export default ActivityTasksSection
