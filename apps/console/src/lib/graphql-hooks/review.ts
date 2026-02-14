import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  Review,
  ReviewQuery,
  ReviewQueryVariables,
  ReviewsWithFilterQuery,
  ReviewsWithFilterQueryVariables,
  CreateReviewMutation,
  CreateReviewMutationVariables,
  CreateBulkCsvReviewMutation,
  CreateBulkCsvTaskMutationVariables,
  DeleteReviewMutation,
  DeleteReviewMutationVariables,
  DeleteBulkReviewMutation,
  DeleteBulkReviewMutationVariables,
  UpdateReviewMutation,
  UpdateReviewMutationVariables,
  UpdateBulkReviewMutation,
  UpdateBulkReviewMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import { REVIEW, GET_ALL_REVIEWS, BULK_DELETE_REVIEW, CREATE_REVIEW, CREATE_CSV_BULK_REVIEW, DELETE_REVIEW, UPDATE_REVIEW, BULK_EDIT_REVIEW } from '@repo/codegen/query/review'

type GetAllReviewsArgs = {
  where?: ReviewsWithFilterQueryVariables['where']
  orderBy?: ReviewsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useReviewsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllReviewsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<ReviewsWithFilterQuery, unknown>({
    queryKey: ['reviews', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<ReviewsWithFilterQuery> => {
      const result = await client.request(GET_ALL_REVIEWS, { where, orderBy, ...pagination?.query })
      return result as ReviewsWithFilterQuery
    },
    enabled,
  })

  const Reviews = (queryResult.data?.reviews?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as Review[]

  return { ...queryResult, Reviews }
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

export const useCreateBulkCSVReview = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvReviewMutation, unknown, CreateBulkCsvTaskMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_REVIEW, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
  })
}

export const useBulkEditReview = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkReviewMutation, unknown, UpdateBulkReviewMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_REVIEW, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
  })
}

export const useBulkDeleteReview = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkReviewMutation, unknown, DeleteBulkReviewMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_REVIEW, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
  })
}
