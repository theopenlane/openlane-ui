import { gql } from 'graphql-request'

export const CREATE_ASSESSMENT = gql`
  mutation CreateAssessment($input: CreateAssessmentInput!) {
    createAssessment(input: $input) {
      assessment {
        id
        name
        assessmentType
        jsonconfig
        uischema
        templateID
        responseDueDuration
        tags
        createdAt
        updatedAt
        createdBy
        updatedBy
        owner {
          id
        }
      }
    }
  }
`

export const GET_ASSESSMENT = gql`
  query GetAssessment($getAssessmentId: ID!) {
    assessment(id: $getAssessmentId) {
      id
      name
      assessmentType
      jsonconfig
      uischema
      templateID
      responseDueDuration
      tags
      createdAt
      updatedAt
    }
  }
`

export const GET_ALL_ASSESSMENTS = gql`
  query FilterAssessments($where: AssessmentWhereInput, $orderBy: [AssessmentOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    assessments(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      edges {
        node {
          id
          name
          assessmentType
          templateID
          jsonconfig
          responseDueDuration
          tags
          createdAt
          updatedAt
          createdBy
          updatedBy
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

export const UPDATE_ASSESSMENT = gql`
  mutation UpdateAssessment($updateAssessmentId: ID!, $input: UpdateAssessmentInput!) {
    updateAssessment(id: $updateAssessmentId, input: $input) {
      assessment {
        id
        name
        assessmentType
        jsonconfig
        uischema
        templateID
        responseDueDuration
        tags
        createdAt
        updatedAt
        owner {
          id
        }
      }
    }
  }
`

export const DELETE_ASSESSMENT = gql`
  mutation DeleteAssessment($deleteAssessmentId: ID!) {
    deleteAssessment(id: $deleteAssessmentId) {
      deletedID
    }
  }
`

export const CREATE_ASSESSMENT_RESPONSE = gql`
  mutation CreateAssessmentResponse($input: CreateAssessmentResponseInput!) {
    createAssessmentResponse(input: $input) {
      assessmentResponse {
        id
        email
        dueDate
        assessmentID
        createdAt
        updatedAt
      }
    }
  }
`

export const DELETE_BULK_ASSESSMENT = gql`
  mutation DeleteBulkAssessment($ids: [ID!]!) {
    deleteBulkAssessment(ids: $ids) {
      deletedIDs
    }
  }
`
