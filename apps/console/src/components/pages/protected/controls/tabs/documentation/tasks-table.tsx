'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { useSession } from 'next-auth/react'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { whereGenerator } from '@/components/shared/table-filter/where-generator'
import { getTasksFilterFields } from '@/components/pages/protected/tasks/table/table-config'
import { useGetSingleOrganizationMembers } from '@/lib/graphql-hooks/organization'
import { useProgramSelect } from '@/lib/graphql-hooks/programs'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enums'
import { useDocumentationTasks } from '@/lib/graphql-hooks/documentation'
import { OrderDirection, TaskOrderField, TaskTaskStatus } from '@repo/codegen/src/schema'
import type { TaskOrder, TaskWhereInput } from '@repo/codegen/src/schema'
import type { WhereCondition } from '@/types'
import type { TPagination } from '@repo/ui/pagination-types'
import type { TOrgMembers } from '@/components/pages/protected/tasks/hooks/useTaskStore'
import { AssociationSection, SearchFilterBar, buildAssociationFilter, getBaseColumns, mergeWhere } from '@/components/pages/protected/controls/tabs/shared/documentation-shared'

type TasksTableProps = {
  controlId?: string
  subcontrolIds: string[]
}

const TasksTable: React.FC<TasksTableProps> = ({ controlId, subcontrolIds }) => {
  const associationFilter = useMemo(() => buildAssociationFilter(controlId, subcontrolIds), [controlId, subcontrolIds])
  const columns = useMemo(() => getBaseColumns(), [])
  const { data: session } = useSession()

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [filters, setFilters] = useState<WhereCondition>({})
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const [orgMembers, setOrgMembers] = useState<TOrgMembers[]>([])
  const { data: membersData } = useGetSingleOrganizationMembers({ organizationId: session?.user.activeOrganizationId })
  const { programOptions, isSuccess: programsReady } = useProgramSelect({})
  const { enumOptions: taskKindOptions, isSuccess: taskKindsReady } = useGetCustomTypeEnums({
    where: {
      objectType: 'task',
      field: 'kind',
    },
  })
  const [filterFields, setFilterFields] = useState<ReturnType<typeof getTasksFilterFields>>()

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
    if (!programsReady || !taskKindsReady) return
    if (filterFields) return
    setFilterFields(getTasksFilterFields(orgMembers, programOptions, taskKindOptions ?? []))
  }, [programsReady, taskKindsReady, filterFields, orgMembers, programOptions, taskKindOptions])

  const where = useMemo(() => {
    const allStatuses = Object.values(TaskTaskStatus)
    const defaultStatuses = allStatuses.filter((status) => status !== TaskTaskStatus.COMPLETED && status !== TaskTaskStatus.WONT_DO)
    let statusInSet = false

    const base: TaskWhereInput = {
      titleContainsFold: debouncedSearch,
    }

    const result = whereGenerator<TaskWhereInput>(filters as TaskWhereInput, (key, value) => {
      if (key === 'hasProgramsWith') {
        return { hasProgramsWith: [{ idIn: value }] } as TaskWhereInput
      }
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

  const rows = useMemo(
    () =>
      tasks.map((task) => ({
        id: task.id,
        name: task.title,
        updatedAt: task.updatedAt,
        href: `/tasks?id=${task.id}`,
      })),
    [tasks],
  )

  return (
    <AssociationSection
      title="Tasks"
      rows={rows}
      columns={columns}
      loading={isLoading}
      pagination={pagination}
      onPaginationChange={setPagination}
      paginationMeta={paginationMeta}
      searchBar={
        <SearchFilterBar
          placeholder="Search tasks"
          isSearching={search !== debouncedSearch}
          searchValue={search}
          onSearchChange={setSearch}
          filterFields={filterFields ?? undefined}
          onFilterChange={setFilters}
        />
      }
    />
  )
}

export default TasksTable
