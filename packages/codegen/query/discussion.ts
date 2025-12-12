import { gql } from 'graphql-request'

export const CREATE_DISCUSSION = gql`
  mutation CreateDiscussion($input: CreateDiscussionInput!) {
    createDiscussion(input: $input) {
      discussion {
        id
        createdAt
        createdBy
      }
    }
  }
`

export const UPDATE_DISCUSSION = gql`
  mutation UpdateDiscussion($updateDiscussionId: ID!, $input: UpdateDiscussionInput!, $first: Int) {
    updateDiscussion(id: $updateDiscussionId, input: $input) {
      discussion {
        updatedBy
        updatedAt
        isResolved
        id
        externalID
        comments(first: $first) {
          edges {
            node {
              createdAt
              createdBy
              displayID
              id
              isEdited
              noteRef
              text
            }
          }
        }
      }
    }
  }
`
