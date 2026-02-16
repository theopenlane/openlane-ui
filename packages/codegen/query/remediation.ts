import { gql } from 'graphql-request'

export const GET_ALL_REMEDIATIONS = gql`
  query RemediationsWithFilter($where: RemediationWhereInput, $orderBy: [RemediationOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    remediations(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          completedAt
          createdAt
          createdBy
          displayID
          dueAt
          environmentID
          environmentName
          error
          explanation
          externalID
          externalOwnerID
          externalURI
          id
          instructions
          intent
          metadata
          ownerReference
          prGeneratedAt
          pullRequestURI
          repositoryURI
          scopeID
          scopeName
          source
          state
          summary
          systemOwned
          ticketReference
          title
          updatedAt
          updatedBy
        }
      }
      pageInfo {
        endCursor
        startCursor
        hasPreviousPage
        hasNextPage
      }
    }
  }
`

export const REMEDIATION = gql`
  query Remediation($remediationId: ID!) {
    remediation(id: $remediationId) {
      completedAt
      createdAt
      createdBy
      displayID
      dueAt
      environmentID
      environmentName
      error
      explanation
      externalID
      externalOwnerID
      externalURI
      id
      instructions
      intent
      metadata
      ownerReference
      prGeneratedAt
      pullRequestURI
      repositoryURI
      scopeID
      scopeName
      source
      state
      summary
      systemOwned
      ticketReference
      title
      updatedAt
      updatedBy
    }
  }
`

export const CREATE_REMEDIATION = gql`
  mutation CreateRemediation($input: CreateRemediationInput!) {
    createRemediation(input: $input) {
      remediation {
        id
      }
    }
  }
`

export const UPDATE_REMEDIATION = gql`
  mutation UpdateRemediation($updateRemediationId: ID!, $input: UpdateRemediationInput!) {
    updateRemediation(id: $updateRemediationId, input: $input) {
      remediation {
        id
      }
    }
  }
`

export const DELETE_REMEDIATION = gql`
  mutation DeleteRemediation($deleteRemediationId: ID!) {
    deleteRemediation(id: $deleteRemediationId) {
      deletedID
    }
  }
`
