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
  query GetAllSubscribers($where: SubscriberWhereInput, $orderBy: [SubscriberOrder!]) {
    subscribers(where: $where, orderBy: $orderBy) {
      edges {
        node {
          active
          email
          id
          verifiedEmail
        }
      }
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
