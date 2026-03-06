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
          tags
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
      tags
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

export const CREATE_CSV_BULK_REVIEW = gql`
  mutation CreateBulkCsvReview($input: Upload!) {
    createBulkCSVReview(input: $input) {
      reviews {
        id
      }
    }
  }
`

export const BULK_EDIT_REVIEW = gql`
  mutation UpdateBulkReview($ids: [ID!]!, $input: UpdateReviewInput!) {
    updateBulkReview(ids: $ids, input: $input) {
      updatedIDs
    }
  }
`

export const GET_REVIEW_ASSOCIATIONS = gql`
  query GetReviewAssociations($reviewId: ID!) {
    review(id: $reviewId) {
      controls {
        edges {
          node {
            id
            refCode
            displayID
            description
          }
        }
        totalCount
      }
      subcontrols {
        edges {
          node {
            id
            refCode
            displayID
            description
          }
        }
        totalCount
      }
      findings {
        edges {
          node {
            id
            displayID
            displayName
          }
        }
        totalCount
      }
      remediations {
        edges {
          node {
            id
            displayID
          }
        }
        totalCount
      }
      vulnerabilities {
        edges {
          node {
            id
            displayID
            displayName
          }
        }
        totalCount
      }
      entities {
        edges {
          node {
            id
            name
            displayName
          }
        }
        totalCount
      }
      tasks {
        edges {
          node {
            id
            title
            displayID
          }
        }
        totalCount
      }
      assets {
        edges {
          node {
            id
            name
            displayName
          }
        }
        totalCount
      }
      programs {
        edges {
          node {
            id
            name
            displayID
          }
        }
        totalCount
      }
    }
  }
`

export const GET_REVIEW_FILES_PAGINATED = gql`
  query GetReviewFilesPaginated($reviewId: ID!, $after: Cursor, $first: Int, $before: Cursor, $last: Int, $orderBy: [FileOrder!]) {
    review(id: $reviewId) {
      files(after: $after, first: $first, before: $before, last: $last, orderBy: $orderBy) {
        pageInfo {
          endCursor
          hasNextPage
          hasPreviousPage
          startCursor
        }
        totalCount
        edges {
          node {
            providedFileName
            providedFileSize
            providedFileExtension
            id
            uri
            presignedURL
          }
        }
      }
    }
  }
`
