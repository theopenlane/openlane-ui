import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { TASKS_WITH_FILTER } from '@repo/codegen/query/tasks'
import { TasksWithFilterQuery, TasksWithFilterQueryVariables } from '@repo/codegen/src/schema'

export const useTasksWithFilter = (where?: TasksWithFilterQueryVariables['where']) => {
  const { client } = useGraphQLClient()

  return useQuery<TasksWithFilterQuery, unknown>({
    queryKey: ['tasks', where],
    queryFn: async () => client.request(TASKS_WITH_FILTER, { where }),
    enabled: where !== undefined,
  })
}
