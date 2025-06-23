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
          mappingType
          relation
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
