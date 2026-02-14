import { gql } from 'graphql-request'

export const GET_ALL_CONTACTS = gql`
  query ContactsWithFilter($where: ContactWhereInput, $orderBy: [ContactOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    contacts(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          address
          company
          createdAt
          createdBy
          email
          fullName
          id
          phoneNumber
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

export const CONTACT = gql`
  query Contact($contactId: ID!) {
    contact(id: $contactId) {
      address
      company
      createdAt
      createdBy
      email
      fullName
      id
      phoneNumber
      title
      updatedAt
      updatedBy
    }
  }
`

export const CREATE_CONTACT = gql`
  mutation CreateContact($input: CreateContactInput!) {
    createContact(input: $input) {
      contact {
        id
      }
    }
  }
`

export const UPDATE_CONTACT = gql`
  mutation UpdateContact($updateContactId: ID!, $input: UpdateContactInput!) {
    updateContact(id: $updateContactId, input: $input) {
      contact {
        id
      }
    }
  }
`

export const DELETE_CONTACT = gql`
  mutation DeleteContact($deleteContactId: ID!) {
    deleteContact(id: $deleteContactId) {
      deletedID
    }
  }
`

export const CREATE_CSV_BULK_CONTACT = gql`
  mutation CreateBulkCSVContact($input: Upload!) {
    createBulkCSVContact(input: $input) {
      contacts {
        id
      }
    }
  }
`

export const BULK_DELETE_CONTACT = gql`
  mutation DeleteBulkContact($ids: [ID!]!) {
    deleteBulkContact(ids: $ids) {
      deletedIDs
    }
  }
`

export const BULK_EDIT_CONTACT = gql`
  mutation UpdateBulkContact($ids: [ID!]!, $input: UpdateContactInput!) {
    updateBulkContact(ids: $ids, input: $input) {
      updatedIDs
    }
  }
`
