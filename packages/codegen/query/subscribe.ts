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
  query GetAllSubscribers {
    subscribers {
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
