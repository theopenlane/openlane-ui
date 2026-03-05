import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type ReviewsWithFilterQuery,
  type ReviewsWithFilterQueryVariables,
  type CreateReviewMutation,
  type CreateReviewMutationVariables,
  type UpdateReviewMutation,
  type UpdateReviewMutationVariables,
  type DeleteReviewMutation,
  type DeleteReviewMutationVariables,
  type ReviewQuery,
  type ReviewQueryVariables,
} from '@repo/codegen/src/schema'

import { type TPagination } from '@repo/ui/pagination-types'
import { GET_ALL_REVIEWS, CREATE_REVIEW, UPDATE_REVIEW, DELETE_REVIEW, REVIEW } from '@repo/codegen/query/review'

type GetAllReviewsArgs = {
  where?: ReviewsWithFilterQueryVariables['where']
  orderBy?: ReviewsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type ReviewsNode = NonNullable<NonNullable<NonNullable<ReviewsWithFilterQuery['reviews']>['edges']>[number]>['node']

export type ReviewsNodeNonNull = NonNullable<ReviewsNode>

export const useReviewsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllReviewsArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<ReviewsWithFilterQuery, unknown>({
    queryKey: ['reviews', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<ReviewsWithFilterQuery> => {
      const result = await client.request<ReviewsWithFilterQuery>(GET_ALL_REVIEWS, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.reviews?.edges ?? []

  const reviewsNodes: ReviewsNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as ReviewsNodeNonNull)

  return { ...queryResult, reviewsNodes }
}

export const useCreateReview = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<CreateReviewMutation, unknown, CreateReviewMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_REVIEW, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
  })
}

export const useUpdateReview = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<UpdateReviewMutation, unknown, UpdateReviewMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_REVIEW, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
  })
}

export const useDeleteReview = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<DeleteReviewMutation, unknown, DeleteReviewMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_REVIEW, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
  })
}

export const useReview = (reviewId?: ReviewQueryVariables['reviewId']) => {
  const { client } = useGraphQLClient()
  return useQuery<ReviewQuery, unknown>({
    queryKey: ['reviews', reviewId],
    queryFn: async (): Promise<ReviewQuery> => {
      const result = await client.request(REVIEW, { reviewId })
      return result as ReviewQuery
    },
    enabled: !!reviewId,
  })
}
