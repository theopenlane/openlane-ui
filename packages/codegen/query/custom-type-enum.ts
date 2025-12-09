import { gql } from 'graphql-request'

export const GET_CUSTOM_TYPE_ENUMS = gql`
  query GetCustomTypeEnums($where: CustomTypeEnumWhereInput) {
    customTypeEnums(where: $where) {
      edges {
        node {
          id
          name
          color
          objectType
          description
          field
        }
      }
    }
  }
`
