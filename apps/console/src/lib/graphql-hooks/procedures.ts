import { useQuery, useMutation } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  CREATE_PROCEDURE,
  UPDATE_PROCEDURE,
  GET_ALL_PROCEDURES_WITH_DETAILS,
  GET_ALL_PROCEDURES,
  GET_PROCEDURE_DETAILS_BY_ID,
  DELETE_PROCEDURE,
  SEARCH_PROCEDURES,
} from '@repo/codegen/query/procedure' // Update import path as needed

import {
  CreateProcedureMutation,
  CreateProcedureMutationVariables,
  UpdateProcedureMutation,
  UpdateProcedureMutationVariables,
  GetAllProceduresWithDetailsQuery,
  GetAllProceduresQuery,
  GetAllProceduresQueryVariables,
  GetProcedureDetailsByIdQuery,
  GetProcedureDetailsByIdQueryVariables,
  DeleteProcedureMutation,
  DeleteProcedureMutationVariables,
  SearchProceduresQuery,
  SearchProceduresQueryVariables,
  Procedure,
} from '@repo/codegen/src/schema'
import { useDebounce } from '../../../../../packages/ui/src/hooks/use-debounce'
import { TPagination } from '@repo/ui/pagination-types'

export const useGetAllProceduresWithDetails = () => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllProceduresWithDetailsQuery>({
    queryKey: ['procedures', 'withDetails'],
    queryFn: () => client.request(GET_ALL_PROCEDURES_WITH_DETAILS),
  })
}

type UseFilteredProceduresArgs = {
  where?: GetAllProceduresQueryVariables['where']
  orderBy?: GetAllProceduresQueryVariables['orderBy']
  pagination?: TPagination
  search: string
}

export const useFilteredProcedures = ({ where, search, orderBy, pagination }: UseFilteredProceduresArgs) => {
  const debouncedSearchTerm = useDebounce(search, 300)
  const { procedures: allProcedures, isLoading: isFetchingAll, ...allQueryRest } = useGetAllProcedures({ where, orderBy, pagination })
  const { procedures: searchProceduresRaw, isLoading: isSearching, ...searchQueryRest } = useSearchProcedures({ search: debouncedSearchTerm, pagination })
  const showSearch = !!debouncedSearchTerm
  const filteredAndOrderedProcedures = showSearch ? allProcedures?.filter((proc) => searchProceduresRaw?.some((searchProc) => searchProc.id === proc.id)) : allProcedures
  const isLoading = showSearch ? isSearching : isFetchingAll

  const paginationMeta = () => {
    if (!showSearch) {
      return {
        totalCount: allQueryRest?.data?.procedures.totalCount ?? 0,
        pageInfo: allQueryRest?.data?.procedures.pageInfo,
        isLoading,
      }
    }

    if (showSearch) {
      return {
        totalCount: searchQueryRest.data?.procedureSearch?.totalCount ?? 0,
        pageInfo: searchQueryRest.data?.procedureSearch?.pageInfo,
        isLoading,
      }
    }

    return {
      totalCount: 0,
      pageInfo: undefined,
      isLoading,
    }
  }

  return {
    procedures: filteredAndOrderedProcedures,
    isLoading,
    paginationMeta: paginationMeta(),
    ...(showSearch ? searchQueryRest : allQueryRest),
  }
}

type GetInternalPoliciesListArgs = {
  where?: GetAllProceduresQueryVariables['where']
  orderBy?: GetAllProceduresQueryVariables['orderBy']
  pagination?: TPagination
}

export const useGetAllProcedures = ({ where, orderBy, pagination }: GetInternalPoliciesListArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetAllProceduresQuery>({
    queryKey: ['procedures', where, orderBy, pagination?.pageSize, pagination?.page],
    queryFn: () => client.request(GET_ALL_PROCEDURES, { where, orderBy, ...pagination?.query }),
    enabled: where !== undefined,
  })

  const procedures = (queryResult.data?.procedures?.edges?.map((edge) => edge?.node) ?? []) as Procedure[]

  return { ...queryResult, procedures }
}

export const useGetProcedureDetailsById = (procedureId?: string) => {
  const { client } = useGraphQLClient()

  return useQuery<GetProcedureDetailsByIdQuery, GetProcedureDetailsByIdQueryVariables>({
    queryKey: ['procedures', procedureId],
    queryFn: () => client.request(GET_PROCEDURE_DETAILS_BY_ID, { procedureId }),
    enabled: !!procedureId,
  })
}

export const useCreateProcedure = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<CreateProcedureMutation, unknown, CreateProcedureMutationVariables>({
    mutationFn: (variables) => client.request(CREATE_PROCEDURE, variables),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procedures'] }),
  })
}

export const useUpdateProcedure = () => {
  const { client } = useGraphQLClient()

  return useMutation<UpdateProcedureMutation, unknown, UpdateProcedureMutationVariables>({
    mutationFn: (variables) => client.request(UPDATE_PROCEDURE, variables),
  })
}

export const useDeleteProcedure = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteProcedureMutation, unknown, DeleteProcedureMutationVariables>({
    mutationFn: (variables) => client.request(DELETE_PROCEDURE, variables),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procedures'] }),
  })
}

type searchInternalPoliciesArgs = {
  search: string
  pagination?: TPagination
}

export function useSearchProcedures({ search, pagination }: searchInternalPoliciesArgs) {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<SearchProceduresQuery, unknown>({
    queryKey: ['searchProcedures', search, pagination?.pageSize, pagination?.page],
    queryFn: async () =>
      client.request<SearchProceduresQuery, SearchProceduresQueryVariables>(SEARCH_PROCEDURES, {
        query: search,
        ...pagination?.query,
      }),
    enabled: !!search,
  })

  const procedures = (queryResult.data?.procedureSearch ?? []) as Procedure[]

  return { ...queryResult, procedures }
}
