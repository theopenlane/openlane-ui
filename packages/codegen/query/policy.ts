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
  query GetInternalPoliciesList($orderBy: [InternalPolicyOrder!], $where: InternalPolicyWhereInput, $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    internalPolicies(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          id
          name
          updatedAt
          updatedBy
          createdAt
          createdBy
          summary
          approvalRequired
          approver {
            displayName
            gravatarLogoURL
            logoURL
          }
          delegate {
            displayName
            gravatarLogoURL
            logoURL
          }
          policyType
          reviewDue
          reviewFrequency
          revision
          status
          tags
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

export const GET_ALL_INTERNAL_POLICIES = gql`
  query GetAllInternalPolicies($where: InternalPolicyWhereInput, $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    internalPolicies(where: $where, first: $first, after: $after, last: $last, before: $before) {
      edges {
        node {
          id
          name
          summary
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
    reviewDue
    reviewFrequency
    approvalRequired
    summary
    approver {
      id
      displayName
      gravatarLogoURL
      logoURL
    }
    delegate {
      id
      displayName
      gravatarLogoURL
      logoURL
    }
    narratives {
      edges {
        node {
          id
          displayID
        }
      }
    }
    procedures {
      edges {
        node {
          id
          name
          displayID
          summary
        }
      }
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
      totalCount
    }
    controls {
      edges {
        node {
          id
          displayID
          refCode
          description
        }
      }
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
      totalCount
    }
    subcontrols {
      edges {
        node {
          id
          displayID
          refCode
          description
          controlId: controlID
        }
      }
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
      totalCount
    }
    programs {
      edges {
        node {
          id
          displayID
          name
          description
        }
      }
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
      totalCount
    }
    tasks {
      edges {
        node {
          id
          displayID
          title
          details
        }
      }
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
      totalCount
    }
    controlObjectives {
      edges {
        node {
          id
          displayID
          name
        }
      }
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
      totalCount
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

export const CREATE_CSV_BULK_INTERNAL_POLICY = gql`
  mutation CreateBulkCSVInternalPolicy($input: Upload!) {
    createBulkCSVInternalPolicy(input: $input) {
      internalPolicies {
        id
      }
    }
  }
`

export const BULK_EDIT_INTERNAL_POLICY = gql`
  mutation UpdateBulkInternalPolicy($ids: [ID!]!, $input: UpdateInternalPolicyInput!) {
    updateBulkInternalPolicy(ids: $ids, input: $input) {
      updatedIDs
    }
  }
`

export const CREATE_UPLOAD_POLICY = gql`
  mutation CreateUploadInternalPolicy($policyFile: Upload!) {
    createUploadInternalPolicy(policyFile: $policyFile) {
      internalPolicy {
        fileID
      }
    }
  }
`
