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

export const useGetAllProceduresWithDetails = () => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllProceduresWithDetailsQuery>({
    queryKey: ['procedures', 'withDetails'],
    queryFn: () => client.request(GET_ALL_PROCEDURES_WITH_DETAILS),
  })
}

export const useFilteredProcedures = (searchQuery: string, where?: GetAllProceduresQueryVariables['where'], orderBy?: GetAllProceduresQueryVariables['orderBy']) => {
  const debouncedSearchTerm = useDebounce(searchQuery, 300)
  const { procedures: allProcedures, isLoading: isFetchingAll, ...allQueryRest } = useGetAllProcedures(where, orderBy)
  const { procedures: searchProceduresRaw, isLoading: isSearching, ...searchQueryRest } = useSearchProcedures(debouncedSearchTerm)
  const showSearch = !!debouncedSearchTerm
  const filteredAndOrderedProcedures = showSearch ? allProcedures?.filter((proc) => searchProceduresRaw?.some((searchProc) => searchProc.id === proc.id)) : allProcedures
  const isLoading = showSearch ? isSearching : isFetchingAll

  return {
    procedures: filteredAndOrderedProcedures,
    isLoading,
    ...(showSearch ? searchQueryRest : allQueryRest),
  }
}

export const useGetAllProcedures = (where?: GetAllProceduresQueryVariables['where'], orderBy?: GetAllProceduresQueryVariables['orderBy']) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetAllProceduresQuery>({
    queryKey: ['procedures', { where, orderBy }],
    queryFn: () => client.request(GET_ALL_PROCEDURES, { where, orderBy }),
    enabled: where !== undefined,
  })

  const procedures = (queryResult.data?.procedures?.edges?.map((edge) => edge?.node) ?? []) as Procedure[]

  return { ...queryResult, procedures }
}

export const useGetProcedureDetailsById = (procedureId?: string) => {
  const { client } = useGraphQLClient()

  return useQuery<GetProcedureDetailsByIdQuery, GetProcedureDetailsByIdQueryVariables>({
    queryKey: ['procedure', procedureId],
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

export function useSearchProcedures(searchQuery: string) {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<SearchProceduresQuery, unknown>({
    queryKey: ['searchProcedures', searchQuery],
    queryFn: async () =>
      client.request<SearchProceduresQuery, SearchProceduresQueryVariables>(SEARCH_PROCEDURES, {
        query: searchQuery,
      }),
    enabled: !!searchQuery,
  })

  const procedures = (queryResult.data?.procedureSearch?.procedures ?? []) as Procedure[]

  return { ...queryResult, procedures }
}
