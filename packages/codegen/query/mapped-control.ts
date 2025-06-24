import { gql } from 'graphql-request'

export const CREATE_MAPPED_CONTROL = gql`
  mutation CreateMappedControl($input: CreateMappedControlInput!) {
    createMappedControl(input: $input) {
      mappedControl {
        id
      }
    }
  }
`

export const GET_MAPPED_CONTROLS = gql`
  query GetMappedControls($where: MappedControlWhereInput) {
    mappedControls(where: $where) {
      edges {
        node {
          id
          relation
          confidence
          mappingType
          fromSubcontrols {
            edges {
              node {
                id
                refCode
                referenceFramework
                control {
                  id
                }
              }
            }
          }
          toSubcontrols {
            edges {
              node {
                id
                refCode
                referenceFramework
                control {
                  id
                }
              }
            }
          }
          fromControls {
            edges {
              node {
                id
                refCode
                referenceFramework
              }
            }
          }
          toControls {
            edges {
              node {
                id
                refCode
                referenceFramework
              }
            }
          }
        }
      }
    }
  }
`

export const GET_MAPPED_CONTROL_BY_ID = gql`
  query GetMappedControlById($mappedControlId: ID!) {
    mappedControl(id: $mappedControlId) {
      id
      relation
      confidence
      mappingType
      fromSubcontrols {
        edges {
          node {
            id
            refCode
            referenceFramework
            control {
              id
            }
          }
        }
      }
      toSubcontrols {
        edges {
          node {
            id
            refCode
            referenceFramework
            control {
              id
            }
          }
        }
      }
      fromControls {
        edges {
          node {
            id
            refCode
            referenceFramework
          }
        }
      }
      toControls {
        edges {
          node {
            id
            refCode
            referenceFramework
          }
        }
      }
    }
  }
`

export const UPDATE_MAPPED_CONTROL = gql`
  mutation updateMappedControl($updateMappedControlId: ID!, $input: UpdateMappedControlInput!) {
    updateMappedControl(id: $updateMappedControlId, input: $input) {
      mappedControl {
        id
      }
    }
  }
`
