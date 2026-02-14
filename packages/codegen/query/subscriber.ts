import { gql } from 'graphql-request'

export const CREATE_SUBSCRIBER = gql`
  mutation CreateSubscriber($input: CreateSubscriberInput!) {
    createSubscriber(input: $input) {
      subscriber {
        email
      }
    }
  }
`

export const GET_ALL_SUBSCRIBERS = gql`
  query GetAllSubscribers($where: SubscriberWhereInput, $orderBy: [SubscriberOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    subscribers(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      edges {
        node {
          active
          email
          id
          verifiedEmail
          createdAt
        }
      }
      pageInfo {
        endCursor
        startCursor
      }
      totalCount
    }
  }
`

export const DELETE_SUBSCRIBER = gql`
  mutation DeleteSubscriber($deleteSubscriberEmail: String!) {
    deleteSubscriber(email: $deleteSubscriberEmail) {
      email
    }
  }
`

export const UNSUBSCRIBE_MUTATION = gql`
  mutation UpdateSubscriber($email: String!, $input: UpdateSubscriberInput!) {
    updateSubscriber(email: $email, input: $input) {
      subscriber {
        id
      }
    }
  }
`

export const CREATE_CSV_BULK_SUBSCRIBER = gql`
  mutation CreateBulkCSVSubscriber($input: Upload!) {
    createBulkCSVSubscriber(input: $input) {
      subscribers {
        id
      }
    }
  }
`
