import { gql } from 'graphql-request'

export const GET_ALL_ASSESSMENT_RESPONSES = gql`
  query AssessmentResponsesWithFilter($where: AssessmentResponseWhereInput, $orderBy: [AssessmentResponseOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    assessmentResponses(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          assessmentID
          assignedAt
          campaignID
          completedAt
          createdAt
          createdBy
          documentDataID
          dueDate
          email
          emailClickCount
          emailClickedAt
          emailDeliveredAt
          emailMetadata
          emailOpenCount
          emailOpenedAt
          entityID
          id
          identityHolderID
          isDraft
          isTest
          lastEmailEventAt
          sendAttempts
          startedAt
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

export const ASSESSMENT_RESPONSE = gql`
  query AssessmentResponse($assessmentResponseId: ID!) {
    assessmentResponse(id: $assessmentResponseId) {
      assessmentID
      assignedAt
      campaignID
      completedAt
      createdAt
      createdBy
      documentDataID
      dueDate
      email
      emailClickCount
      emailClickedAt
      emailDeliveredAt
      emailMetadata
      emailOpenCount
      emailOpenedAt
      entityID
      id
      identityHolderID
      isDraft
      isTest
      lastEmailEventAt
      sendAttempts
      startedAt
      updatedAt
      updatedBy
    }
  }
`

export const CREATE_ASSESSMENT_RESPONSE = gql`
  mutation CreateAssessmentResponse($input: CreateAssessmentResponseInput!) {
    createAssessmentResponse(input: $input) {
      assessmentResponse {
        id
      }
    }
  }
`
export const DELETE_ASSESSMENT_RESPONSE = gql`
  mutation DeleteAssessmentResponse($deleteAssessmentResponseId: ID!) {
    deleteAssessmentResponse(id: $deleteAssessmentResponseId) {
      deletedID
    }
  }
`
