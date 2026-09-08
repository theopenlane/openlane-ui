import { type TaskOrder, type TaskTaskStatus, type TaskWhereInput } from '@repo/codegen/src/schema'
import { CARD_DEFAULT_PAGINATION } from '@/constants/pagination'
import { getTasksInfiniteQueryKey } from '@/lib/graphql-hooks/task'

export type TaskBoardOrderBy = TaskOrder[] | TaskOrder | undefined

export const getColumnQueryArgs = (whereFilter: TaskWhereInput, orderBy: TaskBoardOrderBy, status: TaskTaskStatus) => ({
  where: { ...whereFilter, and: [...(whereFilter.and ?? []), { status }] },
  orderBy,
  pageSize: CARD_DEFAULT_PAGINATION.pageSize,
})

export const getColumnQueryKey = (whereFilter: TaskWhereInput, orderBy: TaskBoardOrderBy, status: TaskTaskStatus) => getTasksInfiniteQueryKey(getColumnQueryArgs(whereFilter, orderBy, status))
