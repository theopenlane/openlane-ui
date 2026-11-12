import { useCallback, useMemo } from 'react'
import { useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query'
import { type GraphQLClient } from 'graphql-request'
import { type TPagination } from '@repo/ui/pagination-types'
import {
  IntegrationRunIntegrationRunStatus,
  IntegrationRunOrderField,
  OrderDirection,
  type GetIntegrationRunQuery,
  type GetIntegrationRunQueryVariables,
  type GetIntegrationRunStatsQuery,
  type GetIntegrationRunStatsQueryVariables,
  type GetIntegrationRunSummariesQuery,
  type GetIntegrationRunSummariesQueryVariables,
  type GetIntegrationRunsQuery,
  type GetIntegrationRunsQueryVariables,
  type IntegrationRunOrder,
  type IntegrationRunWhereInput,
} from '@repo/codegen/src/schema'
import { GET_INTEGRATION_RUN, GET_INTEGRATION_RUNS, GET_INTEGRATION_RUN_STATS, GET_INTEGRATION_RUN_SUMMARIES } from '@repo/codegen/query/integration-health'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { getNodes, type Connection } from '@/lib/graphql-hooks/connection'
import { RUN_STRIP_LENGTH, operationRunsKey, runOutcomeMeta, type TIntegrationRunSummary } from '@/lib/integrations/run-health'

export const INTEGRATION_RUNS_QUERY_KEY = 'integrationRuns'

export const NEWEST_RUNS_FIRST = { field: IntegrationRunOrderField.STARTED_AT, direction: OrderDirection.DESC } satisfies IntegrationRunOrder

const UNFINISHED_RUN_POLL_MS = 10 * 1000 // 10s

const pollWhileUnfinished = (runs?: Connection<Pick<TIntegrationRunSummary, 'status' | 'error'>> | null): number | false =>
  getNodes(runs).some((run) => !runOutcomeMeta(run).isFinished) ? UNFINISHED_RUN_POLL_MS : false

type TIntegrationRunsArgs = {
  where: IntegrationRunWhereInput
  orderBy?: IntegrationRunOrder
  pagination: TPagination
  enabled?: boolean
}

export const useIntegrationRuns = ({ where, orderBy = NEWEST_RUNS_FIRST, pagination, enabled = true }: TIntegrationRunsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery({
    queryKey: [INTEGRATION_RUNS_QUERY_KEY, 'list', where, orderBy, pagination.page, pagination.pageSize],
    queryFn: async () => client.request<GetIntegrationRunsQuery, GetIntegrationRunsQueryVariables>(GET_INTEGRATION_RUNS, { where, orderBy, ...pagination.query }),
    enabled,
    refetchInterval: (query) => pollWhileUnfinished(query.state.data?.integrationRuns),
  })

  const runs = useMemo(() => getNodes(queryResult.data?.integrationRuns), [queryResult.data?.integrationRuns])

  return { ...queryResult, runs }
}

type TIntegrationRunSummariesArgs = {
  where: IntegrationRunWhereInput
  first: number
}

const runSummariesQueryOptions = (client: GraphQLClient, { where, first }: TIntegrationRunSummariesArgs) => ({
  queryKey: [INTEGRATION_RUNS_QUERY_KEY, 'summaries', where, first],
  queryFn: async () => client.request<GetIntegrationRunSummariesQuery, GetIntegrationRunSummariesQueryVariables>(GET_INTEGRATION_RUN_SUMMARIES, { where, orderBy: NEWEST_RUNS_FIRST, first }),
  placeholderData: undefined,
  refetchInterval: (query: { state: { data?: GetIntegrationRunSummariesQuery } }) => pollWhileUnfinished(query.state.data?.integrationRuns),
})

export const useIntegrationRunSummaries = ({ enabled = true, ...args }: TIntegrationRunSummariesArgs & { enabled?: boolean }) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery({ ...runSummariesQueryOptions(client, args), enabled })

  const runs = useMemo(() => getNodes(queryResult.data?.integrationRuns), [queryResult.data?.integrationRuns])

  return { ...queryResult, runs }
}

export const operationRunsWhere = (integrationId: string, operationName: string): IntegrationRunWhereInput => ({ integrationID: integrationId, operationName })

export type TOperationRunsKey = { integrationId: string; operationName: string }

export const useOperationRunStrips = (keys: TOperationRunsKey[]) => {
  const { client } = useGraphQLClient()

  const combine = useCallback(
    (results: UseQueryResult<GetIntegrationRunSummariesQuery>[]) => ({
      runsByKey: Object.fromEntries(
        results.map((result, index): [string, TIntegrationRunSummary[] | undefined] => [
          operationRunsKey(keys[index].integrationId, keys[index].operationName),
          result.data ? getNodes(result.data.integrationRuns) : undefined,
        ]),
      ),
      isPending: results.some((result) => result.isPending),
      error: results.find((result) => result.error)?.error ?? null,
    }),
    [keys],
  )

  return useQueries({
    queries: keys.map(({ integrationId, operationName }) => runSummariesQueryOptions(client, { where: operationRunsWhere(integrationId, operationName), first: RUN_STRIP_LENGTH })),
    combine,
  })
}

type UseIntegrationRunStatsArgs = {
  integrationIds: string[]
  since: string
}

export const useIntegrationRunStats = ({ integrationIds, since }: UseIntegrationRunStatsArgs) => {
  const { client } = useGraphQLClient()

  const variables = useMemo<GetIntegrationRunStatsQueryVariables>(() => {
    const scope: IntegrationRunWhereInput = { integrationIDIn: integrationIds }

    return {
      totalWhere: { ...scope, startedAtGTE: since },
      failedWhere: { ...scope, startedAtGTE: since, status: IntegrationRunIntegrationRunStatus.FAILED },
      lastSuccessWhere: { ...scope, status: IntegrationRunIntegrationRunStatus.SUCCESS, finishedAtNotNil: true },
    }
  }, [integrationIds, since])

  const queryResult = useQuery({
    queryKey: [INTEGRATION_RUNS_QUERY_KEY, 'stats', variables],
    queryFn: async () => client.request<GetIntegrationRunStatsQuery, GetIntegrationRunStatsQueryVariables>(GET_INTEGRATION_RUN_STATS, variables),
    enabled: integrationIds.length > 0,
    placeholderData: undefined,
  })

  return {
    ...queryResult,
    total: queryResult.data?.total.totalCount,
    failed: queryResult.data?.failed.totalCount,
    lastSuccess: getNodes(queryResult.data?.lastSuccess)[0],
  }
}

export type TIntegrationRunDetail = NonNullable<NonNullable<NonNullable<NonNullable<GetIntegrationRunQuery['integrationRuns']>['edges']>[number]>['node']>

export const useIntegrationRun = (integrationRunId: string) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery({
    queryKey: [INTEGRATION_RUNS_QUERY_KEY, 'detail', integrationRunId],
    queryFn: async () => client.request<GetIntegrationRunQuery, GetIntegrationRunQueryVariables>(GET_INTEGRATION_RUN, { integrationRunId }),
    enabled: !!integrationRunId,
    placeholderData: undefined,
    refetchInterval: (query) => pollWhileUnfinished(query.state.data?.integrationRuns),
  })

  return { ...queryResult, run: getNodes(queryResult.data?.integrationRuns)[0] }
}
