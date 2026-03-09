import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  ReviewsWithFilterQuery,
  ReviewsWithFilterQueryVariables,
  CreateReviewMutation,
  CreateReviewMutationVariables,
  UpdateReviewMutation,
  UpdateReviewMutationVariables,
  UpdateBulkReviewMutation,
  UpdateBulkReviewMutationVariables,
  DeleteReviewMutation,
  DeleteReviewMutationVariables,
  ReviewQuery,
  ReviewQueryVariables,
  GetReviewAssociationsQuery,
  GetReviewFilesPaginatedQuery,
  FileOrder,
  InputMaybe,
} from '@repo/codegen/src/schema'

import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import {
  GET_ALL_REVIEWS,
  CREATE_REVIEW,
  UPDATE_REVIEW,
  DELETE_REVIEW,
  REVIEW,
  CREATE_CSV_BULK_REVIEW,
  BULK_EDIT_REVIEW,
  GET_REVIEW_ASSOCIATIONS,
  GET_REVIEW_FILES_PAGINATED,
} from '@repo/codegen/query/review'

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
  const { queryClient } = useGraphQLClient()
  return useMutation<CreateReviewMutation, unknown, CreateReviewMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_REVIEW, variables }),
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

export const useUploadReviewFiles = () => {
  const { queryClient } = useGraphQLClient()
  return useMutation<UpdateReviewMutation, unknown, UpdateReviewMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: UPDATE_REVIEW, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviewFiles'] })
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

export const useBulkEditReview = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkReviewMutation, unknown, UpdateBulkReviewMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_REVIEW, variables),
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
  return useMutation<unknown, unknown, { input: File }>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_REVIEW, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
  })
}

export const useGetReviewAssociations = (reviewId?: string) => {
  const { client } = useGraphQLClient()
  return useQuery<GetReviewAssociationsQuery, unknown>({
    queryKey: ['reviews', reviewId, 'associations'],
    queryFn: async () => client.request<GetReviewAssociationsQuery>(GET_REVIEW_ASSOCIATIONS, { reviewId: reviewId as string }),
    enabled: !!reviewId,
  })
}

type ReviewFilesPaginationArgs = {
  reviewId?: string | null
  orderBy?: InputMaybe<Array<FileOrder> | FileOrder>
  pagination?: TPagination
}

export const useGetReviewFilesPaginated = ({ reviewId, orderBy, pagination }: ReviewFilesPaginationArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetReviewFilesPaginatedQuery, unknown>({
    queryKey: ['reviewFiles', reviewId, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async () =>
      client.request(GET_REVIEW_FILES_PAGINATED, {
        reviewId,
        orderBy,
        ...pagination?.query,
      }),
    enabled: !!reviewId,
  })

  const review = queryResult.data?.review
  const files = review?.files?.edges?.map((edge) => edge?.node) ?? []
  const pageInfo = review?.files?.pageInfo
  const totalCount = review?.files?.totalCount

  return {
    ...queryResult,
    files,
    pageInfo,
    totalCount,
  }
}
