import { gql } from 'graphql-request'

export const GET_ALL_REVIEWS = gql`
  query ReviewsWithFilter($where: ReviewWhereInput, $orderBy: [ReviewOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    reviews(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          approved
          approvedAt
          category
          classification
          createdAt
          createdBy
          details
          environmentID
          environmentName
          externalID
          externalOwnerID
          externalURI
          id
          metadata
          rawPayload
          reportedAt
          reporter
          reviewedAt
          reviewerID
          scopeID
          scopeName
          source
          state
          summary
          systemOwned
          title
          updatedAt
          updatedBy
        }
      }
      pageInfo {
        endCursor
        startCursor
        hasPreviousPage
        hasNextPage
      }
    }
  }
`

export const REVIEW = gql`
  query Review($reviewId: ID!) {
    review(id: $reviewId) {
      approved
      approvedAt
      category
      classification
      createdAt
      createdBy
      details
      environmentID
      environmentName
      externalID
      externalOwnerID
      externalURI
      id
      metadata
      rawPayload
      reportedAt
      reporter
      reviewedAt
      reviewerID
      scopeID
      scopeName
      source
      state
      summary
      systemOwned
      title
      updatedAt
      updatedBy
    }
  }
`

export const CREATE_REVIEW = gql`
  mutation CreateReview($input: CreateReviewInput!) {
    createReview(input: $input) {
      review {
        id
      }
    }
  }
`

export const UPDATE_REVIEW = gql`
  mutation UpdateReview($updateReviewId: ID!, $input: UpdateReviewInput!) {
    updateReview(id: $updateReviewId, input: $input) {
      review {
        id
      }
    }
  }
`

export const DELETE_REVIEW = gql`
  mutation DeleteReview($deleteReviewId: ID!) {
    deleteReview(id: $deleteReviewId) {
      deletedID
    }
  }
`
