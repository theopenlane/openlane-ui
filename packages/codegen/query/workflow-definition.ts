import { gql } from 'graphql-request'

export const GET_ALL_WORKFLOW_DEFINITIONS = gql`
  query WorkflowDefinitionsWithFilter($where: WorkflowDefinitionWhereInput, $orderBy: [WorkflowDefinitionOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    workflowDefinitions(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          active
          cooldownSeconds
          createdAt
          createdBy
          definitionJSON
          description
          displayID
          draft
          id
          isDefault
          name
          publishedAt
          revision
          schemaType
          systemOwned
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

export const WORKFLOW_DEFINITION = gql`
  query WorkflowDefinition($workflowDefinitionId: ID!) {
    workflowDefinition(id: $workflowDefinitionId) {
      active
      cooldownSeconds
      createdAt
      createdBy
      definitionJSON
      description
      displayID
      draft
      id
      isDefault
      name
      publishedAt
      revision
      schemaType
      systemOwned
      updatedAt
      updatedBy
    }
  }
`

export const CREATE_WORKFLOW_DEFINITION = gql`
  mutation CreateWorkflowDefinition($input: CreateWorkflowDefinitionInput!) {
    createWorkflowDefinition(input: $input) {
      workflowDefinition {
        id
      }
    }
  }
`

export const UPDATE_WORKFLOW_DEFINITION = gql`
  mutation UpdateWorkflowDefinition($updateWorkflowDefinitionId: ID!, $input: UpdateWorkflowDefinitionInput!) {
    updateWorkflowDefinition(id: $updateWorkflowDefinitionId, input: $input) {
      workflowDefinition {
        id
      }
    }
  }
`

export const DELETE_WORKFLOW_DEFINITION = gql`
  mutation DeleteWorkflowDefinition($deleteWorkflowDefinitionId: ID!) {
    deleteWorkflowDefinition(id: $deleteWorkflowDefinitionId) {
      deletedID
    }
  }
`
