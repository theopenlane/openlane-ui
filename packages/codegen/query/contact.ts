import { gql } from 'graphql-request'

export const GET_CONTACTS = gql`
  query GetContacts($where: ContactWhereInput, $first: Int) {
    contacts(where: $where, first: $first) {
      edges {
        node {
          id
          fullName
          email
          company
          title
          status
        }
      }
    }
  }
`
