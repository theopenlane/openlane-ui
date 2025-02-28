import { gql } from 'graphql-request'

export const CREATE_INTERNAL_POLICY = gql`
  mutation CreateInternalPolicy($input: CreateInternalPolicyInput!) {
    createInternalPolicy(input: $input) {
      internalPolicy {
        id
        name
        background
        description
        policyType
        purposeAndScope
        details
      }
    }
  }
`

export const INTERNAL_POLICY_UPDATE_FIELDS = gql`
  fragment InternalPolicyUpdateFields on InternalPolicy {
    id
    name
    background
    description
    policyType
    purposeAndScope
    details
  }
`

export const UPDATE_INTERNAL_POLICY = gql`
  mutation UpdateInternalPolicy($updateInternalPolicyId: ID!, $input: UpdateInternalPolicyInput!) {
    updateInternalPolicy(id: $updateInternalPolicyId, input: $input) {
      internalPolicy {
        ...InternalPolicyUpdateFields
      }
    }
  }
  ${INTERNAL_POLICY_UPDATE_FIELDS}
`

export const DELETE_INTERNAL_POLICY = gql`
  mutation DeleteInternalPolicy($deleteInternalPolicyId: ID!) {
    deleteInternalPolicy(id: $deleteInternalPolicyId) {
      deletedID
    }
  }
`

export const GET_ALL_INTERNAL_POLICIES_WITH_DETAILS = gql`
  query GetAllInternalPoliciesWithDetails {
    internalPolicies {
      edges {
        node {
          id
          name
          background
          description
          policyType
          purposeAndScope
          status
          version
          updatedAt
          updatedBy
          createdAt
          createdBy
          tags
        }
      }
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
          description
          policyType
          tags
          version
          updatedAt
          updatedBy
          createdAt
          createdBy
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
    description
    details
    background
    createdAt
    createdBy
    updatedAt
    updatedBy
    tags
    version
    status
    purposeAndScope
    policyType
    procedures {
      id
      name
    }
  }
`

export const GET_INTERNAL_POLICY_DETAILS_BY_ID = gql`
  query GetInternalPolicyDetailsById($internalPolicyId: ID!) {
    internalPolicy(id: $internalPolicyId) {
      ...InternalPolicyByID
      procedures {
        id
        name
      }
    }
  }
  ${INTERNAL_POLICY_BY_ID}
`
