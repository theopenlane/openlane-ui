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
