import { gql } from 'graphql-request'

export const CONTROL_IMPLEMENTATION_FIELDS = gql`
  fragment ControlImplementationFields on ControlImplementation {
    id
    details
    status
    implementationDate
    verified
    verificationDate
    controls {
      edges {
        node {
          id
          refCode
          description
          referenceFramework
          __typename
        }
      }
    }
    subcontrols {
      edges {
        node {
          id
          refCode
          referenceFramework
          __typename
          control {
            refCode
            description
            id
          }
        }
      }
    }
  }
`
export const GET_ALL_CONTROL_IMPLEMENTATIONS = gql`
  ${CONTROL_IMPLEMENTATION_FIELDS}

  query GetAllControlImplementations($where: ControlImplementationWhereInput, $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    controlImplementations(where: $where, first: $first, after: $after, last: $last, before: $before) {
      edges {
        node {
          ...ControlImplementationFields
        }
      }
      pageInfo {
        endCursor
        startCursor
        hasPreviousPage
        hasNextPage
      }
      totalCount
    }
  }
`

export const CREATE_CONTROL_IMPLEMENTATION = gql`
  mutation CreateControlImplementation($input: CreateControlImplementationInput!) {
    createControlImplementation(input: $input) {
      controlImplementation {
        id
      }
    }
  }
`

export const UPDATE_CONTROL_IMPLEMENTATION = gql`
  mutation UpdateControlImplementation($updateControlImplementationId: ID!, $input: UpdateControlImplementationInput!) {
    updateControlImplementation(id: $updateControlImplementationId, input: $input) {
      controlImplementation {
        id
      }
    }
  }
`

export const DELETE_CONTROL_IMPLEMENTATION = gql`
  mutation DeleteControlImplementation($deleteControlImplementationId: ID!) {
    deleteControlImplementation(id: $deleteControlImplementationId) {
      deletedID
    }
  }
`

export const CONTROL_IMPLEMENTATION_SUMMARY_FIELDS = gql`
  fragment ControlImplementationSummaryFields on ControlImplementation {
    id
    status
    implementationDate
    verified
    verificationDate
    tags
    createdAt
    createdBy
    updatedAt
    updatedBy
    controls(orderBy: [{ field: ref_code, direction: ASC }]) {
      edges {
        node {
          id
          refCode
          referenceFramework
        }
      }
    }
    subcontrols(orderBy: [{ field: ref_code, direction: ASC }]) {
      edges {
        node {
          id
          refCode
          referenceFramework
          controlID
        }
      }
    }
  }
`

export const CONTROL_IMPLEMENTATIONS_WITH_FILTER = gql`
  ${CONTROL_IMPLEMENTATION_SUMMARY_FIELDS}

  query ControlImplementationsWithFilter($where: ControlImplementationWhereInput, $orderBy: [ControlImplementationOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    controlImplementations(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      pageInfo {
        endCursor
        startCursor
        hasPreviousPage
        hasNextPage
      }
      edges {
        node {
          ...ControlImplementationSummaryFields
        }
      }
    }
  }
`

export const CONTROL_IMPLEMENTATION = gql`
  ${CONTROL_IMPLEMENTATION_SUMMARY_FIELDS}

  query ControlImplementation($controlImplementationId: ID!) {
    controlImplementation(id: $controlImplementationId) {
      ...ControlImplementationSummaryFields
      details
    }
  }
`

export const GET_CONTROL_IMPLEMENTATION_ASSOCIATIONS = gql`
  query GetControlImplementationAssociations($controlImplementationId: ID!) {
    controlImplementation(id: $controlImplementationId) {
      id
      controls(orderBy: [{ field: ref_code, direction: ASC }]) {
        totalCount
        edges {
          node {
            id
            refCode
            description
            referenceFramework
            displayID
            __typename
          }
        }
      }
      subcontrols(orderBy: [{ field: ref_code, direction: ASC }]) {
        totalCount
        edges {
          node {
            id
            refCode
            description
            referenceFramework
            displayID
            __typename
            control {
              id
            }
          }
        }
      }
      tasks {
        totalCount
        edges {
          node {
            id
            title
            displayID
            details
            __typename
          }
        }
      }
    }
  }
`

export const CONTROL_IMPLEMENTATION_REFERENCE_FIELDS = gql`
  fragment ControlImplementationReferenceFields on ControlImplementation {
    id
    controls {
      edges {
        node {
          refCode
          referenceFramework
        }
      }
    }
    subcontrols {
      edges {
        node {
          refCode
          referenceFramework
        }
      }
    }
  }
`

export const GET_CONTROL_IMPLEMENTATION_LINKED_CONTROLS = gql`
  ${CONTROL_IMPLEMENTATION_REFERENCE_FIELDS}

  query GetControlImplementationLinkedControls($controlImplementationId: ID!) {
    controlImplementation(id: $controlImplementationId) {
      id
      controls(orderBy: [{ field: ref_code, direction: ASC }]) {
        totalCount
        edges {
          node {
            id
            refCode
            title
            status
            referenceFramework
            controlImplementations(where: { idNEQ: $controlImplementationId }, orderBy: [{ field: updated_at, direction: DESC }]) {
              totalCount
              edges {
                node {
                  ...ControlImplementationReferenceFields
                }
              }
            }
          }
        }
      }
      subcontrols(orderBy: [{ field: ref_code, direction: ASC }]) {
        totalCount
        edges {
          node {
            id
            refCode
            title
            status
            referenceFramework
            control {
              id
              refCode
              title
              referenceFramework
            }
            controlImplementations(where: { idNEQ: $controlImplementationId }, orderBy: [{ field: updated_at, direction: DESC }]) {
              totalCount
              edges {
                node {
                  ...ControlImplementationReferenceFields
                }
              }
            }
          }
        }
      }
    }
  }
`

export const BULK_EDIT_CONTROL_IMPLEMENTATION = gql`
  mutation UpdateBulkControlImplementation($ids: [ID!]!, $input: UpdateControlImplementationInput!) {
    updateBulkControlImplementation(ids: $ids, input: $input) {
      updatedIDs
      notUpdatedIDs
      error
    }
  }
`

export const BULK_DELETE_CONTROL_IMPLEMENTATION = gql`
  mutation DeleteBulkControlImplementation($ids: [ID!]!) {
    deleteBulkControlImplementation(ids: $ids) {
      deletedIDs
      notDeletedIDs
      error
    }
  }
`
