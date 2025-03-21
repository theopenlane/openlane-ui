import { gql } from 'graphql-request'

export const GET_ALL_CONTROLS = gql`
  fragment ControlFields on Control {
    id
    displayID
    category
    refCode
    subcategory
    description
    mappedCategories
    subcontrols {
      totalCount
    }
  }

  query GetAllControls($where: ControlWhereInput) {
    controls(where: $where) {
      edges {
        node {
          ...ControlFields
        }
      }
    }
  }
`
