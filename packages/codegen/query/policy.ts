import { gql } from 'graphql-request'

export const CREATE_INTERNAL_POLICY = gql`
  mutation CreateInternalPolicy($input: CreateInternalPolicyInput!) {
    createInternalPolicy(input: $input) {
      internalPolicy {
        id
        name
        policyType
        details
      }
    }
  }
`

export const UPDATE_INTERNAL_POLICY = gql`
  mutation UpdateInternalPolicy($updateInternalPolicyId: ID!, $input: UpdateInternalPolicyInput!) {
    updateInternalPolicy(id: $updateInternalPolicyId, input: $input) {
      internalPolicy {
        id
        name
        policyType
        details
      }
    }
  }
`

export const DELETE_INTERNAL_POLICY = gql`
  mutation DeleteInternalPolicy($deleteInternalPolicyId: ID!) {
    deleteInternalPolicy(id: $deleteInternalPolicyId) {
      deletedID
    }
  }
`

export const GET_INTERNAL_POLICIES_LIST = gql`
  query GetInternalPoliciesList {
    internalPolicies {
      edges {
        node {
          id
          name
          policyType
          tags
          revision
          updatedAt
          updatedBy
          createdAt
          createdBy
          details
        }
      }
    }
  }
`

export const GET_ALL_INTERNAL_POLICIES = gql`
  query GetAllInternalPolicies {
    internalPolicies {
      edges {
        node {
          id
          name
        }
      }
    }
  }
`

export const INTERNAL_POLICY_BY_ID = gql`
  fragment InternalPolicyByID on InternalPolicy {
    id
    name
    details
    createdAt
    createdBy
    updatedAt
    updatedBy
    tags
    revision
    status
    policyType
    displayID
    details
    procedures {
      edges {
        node {
          id
          name
        }
      }
    }
  }
`

export const GET_INTERNAL_POLICY_DETAILS_BY_ID = gql`
  query GetInternalPolicyDetailsById($internalPolicyId: ID!) {
    internalPolicy(id: $internalPolicyId) {
      ...InternalPolicyByID
    }
  }
  ${INTERNAL_POLICY_BY_ID}
`

export const SEARCH_INTERNAL_POLICIES = gql`
  query SearchInternalPolicies($query: String!) {
    internalPolicySearch(query: $query) {
      internalPolicies {
        id
        name
        displayID
        status
        revision
        updatedAt
        updatedBy
        createdAt
        createdBy
        tags
        details
      }
    }
  }
`
