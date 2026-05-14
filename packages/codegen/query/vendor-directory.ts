import { gql } from 'graphql-request'

export const GET_VENDOR_DIRECTORY = gql`
  query GetVendorDirectory($integrationIDs: [ID!]!, $first: Int, $after: Cursor) {
    directoryGroups(where: { integrationIDIn: $integrationIDs }, orderBy: [{ field: display_name, direction: ASC }], first: $first, after: $after) {
      totalCount
      pageInfo {
        endCursor
        hasNextPage
      }
      edges {
        node {
          id
          displayName
          email
          integration {
            id
            name
          }
          members(first: 250, orderBy: [{ field: created_at, direction: DESC }]) {
            totalCount
            edges {
              node {
                id
                role
                addedAt
                removedAt
                directoryAccount {
                  id
                  canonicalEmail
                  displayName
                  givenName
                  familyName
                  identityHolderID
                  identityHolder {
                    id
                    fullName
                    email
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`
