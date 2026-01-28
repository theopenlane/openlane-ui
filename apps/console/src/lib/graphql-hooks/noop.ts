import { useQuery, useMutation, useQueryClient, useInfiniteQuery, InfiniteData } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { gql } from 'graphql-request'
import { fetchGraphQLWithUpload } from '../fetchGraphql'
import { Exact, Scalars } from '@repo/codegen/src/schema'

// BULK_EDIT is a placeholder no-op mutation
const BULK_EDIT = gql`
  mutation UpdateBulk($ids: [ID!]!, $input: UpdateInput!) {
    updateBulk(ids: $ids, input: $input) {
      updatedIDs
    }
  }
`

export type UpdateBulkMutation = { __typename?: 'Mutation'; updateBulk: { __typename?: 'BulkUpdatePayload'; updatedIDs?: Array<string> | null } }

export type UpdateBulkMutationVariables = Exact<{
  ids: Array<Scalars['ID']['input']> | Scalars['ID']['input']
  input: any
}>

// useBulkEdit is a placeholder no-op hook
export const useBulkEdit = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateBulkMutation, unknown, UpdateBulkMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['noop'] })
    },
  })
}

export const CREATE_CSV_BULK = gql`
  mutation CreateBulkCSV($input: Upload!) {
    createBulkCSV(input: $input) {
      OBJECTS {
        id
      }
    }
  }
`

export type CreateBulkCsvMutationVariables = Exact<{
  input: Scalars['Upload']['input']
}>

export type CreateBulkCsvMutation = { __typename?: 'Mutation'; createBulkCSV: { __typename?: 'BulkCreatePayload'; OBJECTS?: Array<{ __typename?: 'OBJECT'; id: string }> | null } }

export const useCreateBulkCSV = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvMutation, unknown, CreateBulkCsvMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
