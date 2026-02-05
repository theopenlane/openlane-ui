import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { TPagination, TPaginationMeta } from '@repo/ui/pagination-types'
import { GET_DOCUMENTATION_POLICIES, GET_DOCUMENTATION_PROCEDURES, GET_DOCUMENTATION_TASKS, GET_DOCUMENTATION_PROGRAMS, GET_DOCUMENTATION_RISKS } from '@repo/codegen/query/documentation'
import type {
  InternalPolicy,
  InternalPolicyOrder,
  InternalPolicyWhereInput,
  Procedure,
  ProcedureOrder,
  ProcedureWhereInput,
  Program,
  ProgramOrder,
  ProgramWhereInput,
  Risk,
  RiskOrder,
  RiskWhereInput,
  Task,
  TaskOrder,
  TaskWhereInput,
  PageInfo,
} from '@repo/codegen/src/schema'

type Edge<T> = { node?: T | null } | null
type Connection<T> = {
  edges?: Array<Edge<T>> | null
  totalCount?: number | null
  pageInfo?: PageInfo | null
}

const getNodes = <T>(connection?: Connection<T> | null): T[] => (connection?.edges ?? []).map((edge) => edge?.node).filter((node): node is T => !!node)

const getPaginationMeta = (connection?: Connection<unknown> | null, isLoading?: boolean): TPaginationMeta => ({
  totalCount: connection?.totalCount ?? 0,
  pageInfo: connection?.pageInfo ?? undefined,
  isLoading,
})

type UseDocListArgs<TWhere, TOrder> = {
  where?: TWhere
  orderBy?: TOrder[] | TOrder | null
  pagination?: TPagination
  enabled?: boolean
}

type DocPoliciesQuery = { internalPolicies: Connection<Pick<InternalPolicy, 'id' | 'name' | 'updatedAt'>> }
export const useDocumentationPolicies = ({ where, orderBy, pagination, enabled = true }: UseDocListArgs<InternalPolicyWhereInput, InternalPolicyOrder>) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<DocPoliciesQuery>({
    queryKey: ['policies', 'documentation-tab', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: () => client.request(GET_DOCUMENTATION_POLICIES, { where, orderBy, ...pagination?.query }),
    enabled,
  })

  const policies = getNodes(queryResult.data?.internalPolicies)

  return {
    ...queryResult,
    policies,
    paginationMeta: getPaginationMeta(queryResult.data?.internalPolicies, queryResult.isFetching),
  }
}

type DocProceduresQuery = { procedures: Connection<Pick<Procedure, 'id' | 'name' | 'updatedAt'>> }
export const useDocumentationProcedures = ({ where, orderBy, pagination, enabled = true }: UseDocListArgs<ProcedureWhereInput, ProcedureOrder>) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<DocProceduresQuery>({
    queryKey: ['procedures', 'documentation-tab', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: () => client.request(GET_DOCUMENTATION_PROCEDURES, { where, orderBy, ...pagination?.query }),
    enabled,
  })

  const procedures = getNodes(queryResult.data?.procedures)

  return {
    ...queryResult,
    procedures,
    paginationMeta: getPaginationMeta(queryResult.data?.procedures, queryResult.isFetching),
  }
}

type DocTasksQuery = { tasks: Connection<Pick<Task, 'id' | 'title' | 'taskKindName' | 'status' | 'due' | 'updatedAt' | 'assignee'>> }
export const useDocumentationTasks = ({ where, orderBy, pagination, enabled = true }: UseDocListArgs<TaskWhereInput, TaskOrder>) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<DocTasksQuery>({
    queryKey: ['tasks', 'documentation-tab', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: () => client.request(GET_DOCUMENTATION_TASKS, { where, orderBy, ...pagination?.query }),
    enabled,
  })

  const tasks = getNodes(queryResult.data?.tasks)

  return {
    ...queryResult,
    tasks,
    paginationMeta: getPaginationMeta(queryResult.data?.tasks, queryResult.isFetching),
  }
}

type DocProgramsQuery = { programs: Connection<Pick<Program, 'id' | 'name' | 'updatedAt'>> }
export const useDocumentationPrograms = ({ where, orderBy, pagination, enabled = true }: UseDocListArgs<ProgramWhereInput, ProgramOrder>) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<DocProgramsQuery>({
    queryKey: ['programs', 'documentation-tab', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: () => client.request(GET_DOCUMENTATION_PROGRAMS, { where, orderBy, ...pagination?.query }),
    enabled,
  })

  const programs = getNodes(queryResult.data?.programs)

  return {
    ...queryResult,
    programs,
    paginationMeta: getPaginationMeta(queryResult.data?.programs, queryResult.isFetching),
  }
}

type DocRisksQuery = { risks: Connection<Pick<Risk, 'id' | 'name' | 'updatedAt'>> }
export const useDocumentationRisks = ({ where, orderBy, pagination, enabled = true }: UseDocListArgs<RiskWhereInput, RiskOrder>) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<DocRisksQuery>({
    queryKey: ['risks', 'documentation-tab', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: () => client.request(GET_DOCUMENTATION_RISKS, { where, orderBy, ...pagination?.query }),
    enabled,
  })

  const risks = getNodes(queryResult.data?.risks)

  return {
    ...queryResult,
    risks,
    paginationMeta: getPaginationMeta(queryResult.data?.risks, queryResult.isFetching),
  }
}
