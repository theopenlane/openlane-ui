import { gql } from 'graphql-request'

export const GET_ASSOCIATION_PICKER_CONTROLS = gql`
  query GetAssociationPickerControls(
    $where: ControlWhereInput
    $orderBy: [ControlOrder!] = [{ field: ref_code, direction: ASC }]
    $first: Int
    $after: Cursor
    $last: Int
    $before: Cursor
    $subcontrolWhere: SubcontrolWhereInput
    $withSubcontrols: Boolean = false
  ) {
    controls(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      edges {
        node {
          __typename
          id
          displayID
          refCode
          title
          category
          referenceFramework
          subcontrols(where: $subcontrolWhere) @include(if: $withSubcontrols) {
            totalCount
          }
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

export const GET_ASSOCIATION_PICKER_SUBCONTROLS = gql`
  query GetAssociationPickerSubcontrols($where: SubcontrolWhereInput, $orderBy: [SubcontrolOrder!] = [{ field: ref_code, direction: ASC }], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    subcontrols(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      edges {
        node {
          __typename
          id
          displayID
          refCode
          title
          referenceFramework
          control {
            id
            refCode
          }
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
