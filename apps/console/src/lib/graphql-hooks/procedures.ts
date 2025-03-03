import { useQuery, useMutation } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { CREATE_PROCEDURE, UPDATE_PROCEDURE, GET_ALL_PROCEDURES_WITH_DETAILS, GET_ALL_PROCEDURES, GET_PROCEDURE_DETAILS_BY_ID } from '@repo/codegen/query/procedure' // Update import path as needed

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
} from '@repo/codegen/src/schema'

export const useGetAllProceduresWithDetails = () => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllProceduresWithDetailsQuery>({
    queryKey: ['procedures', 'withDetails'],
    queryFn: () => client.request(GET_ALL_PROCEDURES_WITH_DETAILS),
  })
}

export const useGetAllProcedures = (where?: GetAllProceduresQueryVariables['where']) => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllProceduresQuery>({
    queryKey: ['procedures', where],
    queryFn: () => client.request(GET_ALL_PROCEDURES, { where }),
    enabled: where !== undefined,
  })
}

export const useGetProcedureDetailsById = (procedureId?: string) => {
  const { client } = useGraphQLClient()

  return useQuery<GetProcedureDetailsByIdQuery, GetProcedureDetailsByIdQueryVariables>({
    queryKey: ['procedure', procedureId],
    queryFn: () => client.request(GET_PROCEDURE_DETAILS_BY_ID, { procedureId }),
    enabled: !!procedureId, // Only run if procedureId is defined
  })
}

export const useCreateProcedure = () => {
  const { client } = useGraphQLClient()

  return useMutation<CreateProcedureMutation, unknown, CreateProcedureMutationVariables>({
    mutationFn: (variables) => client.request(CREATE_PROCEDURE, variables),
    // onSuccess: () => { /* Optional: invalidate queries here */ }
  })
}

export const useUpdateProcedure = () => {
  const { client } = useGraphQLClient()

  return useMutation<UpdateProcedureMutation, unknown, UpdateProcedureMutationVariables>({
    mutationFn: (variables) => client.request(UPDATE_PROCEDURE, variables),
    // onSuccess: () => { /* Optional: invalidate queries here */ }
  })
}
