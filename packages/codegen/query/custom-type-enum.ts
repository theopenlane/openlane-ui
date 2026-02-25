import { gql } from 'graphql-request'

export const CUSTOM_TYPE_ENUM_FIELDS = gql`
  fragment CustomTypeEnumFields on CustomTypeEnum {
    id
    name
    color
    objectType
    description
    field
    systemOwned
  }
`

export const GET_CUSTOM_TYPE_ENUMS = gql`
  query GetCustomTypeEnums($where: CustomTypeEnumWhereInput) {
    customTypeEnums(where: $where) {
      edges {
        node {
          ...CustomTypeEnumFields
        }
      }
    }
  }
  ${CUSTOM_TYPE_ENUM_FIELDS}
`

export const GET_CUSTOM_TYPE_ENUMS_PAGINATED = gql`
  query GetCustomTypeEnumsPaginated($after: Cursor, $first: Int, $before: Cursor, $last: Int, $where: CustomTypeEnumWhereInput, $orderBy: [CustomTypeEnumOrder!]) {
    customTypeEnums(after: $after, first: $first, before: $before, last: $last, where: $where, orderBy: $orderBy) {
      edges {
        node {
          ...CustomTypeEnumFields
          updatedBy
          updatedAt
          createdAt
          createdBy
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
  ${CUSTOM_TYPE_ENUM_FIELDS}
`

export const GET_CUSTOM_TYPE_ENUM_BY_ID = gql`
  query GetCustomTypeEnumById($id: ID!) {
    customTypeEnum(id: $id) {
      ...CustomTypeEnumFields
    }
  }
  ${CUSTOM_TYPE_ENUM_FIELDS}
`

export const CREATE_CUSTOM_TYPE_ENUM = gql`
  mutation CreateCustomTypeEnum($input: CreateCustomTypeEnumInput!) {
    createCustomTypeEnum(input: $input) {
      customTypeEnum {
        ...CustomTypeEnumFields
      }
    }
  }
  ${CUSTOM_TYPE_ENUM_FIELDS}
`

export const UPDATE_CUSTOM_TYPE_ENUM = gql`
  mutation UpdateCustomTypeEnum($id: ID!, $input: UpdateCustomTypeEnumInput!) {
    updateCustomTypeEnum(id: $id, input: $input) {
      customTypeEnum {
        ...CustomTypeEnumFields
      }
    }
  }
  ${CUSTOM_TYPE_ENUM_FIELDS}
`

export const DELETE_CUSTOM_TYPE_ENUM = gql`
  mutation DeleteCustomTypeEnum($id: ID!) {
    deleteCustomTypeEnum(id: $id) {
      deletedID
    }
  }
`
