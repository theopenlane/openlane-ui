import { gql } from 'graphql-request'

export const MARK_NOTIFICATIONS_AS_READ = gql`
  mutation MarkNotificationsAsRead($ids: [ID!]!) {
    markNotificationsAsRead(ids: $ids) {
      readIDs
    }
  }
`
