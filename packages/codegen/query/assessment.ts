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
          template {
            id
            name
          }
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

export const GET_ASSESSMENT_DETAIL = gql`
  query GetAssessmentDetail($getAssessmentId: ID!, $where: AssessmentResponseWhereInput, $orderBy: [AssessmentResponseOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
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
      assessmentResponses(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
        totalCount
        edges {
          node {
            id
            email
            dueDate
            status
            sendAttempts
            assignedAt
            startedAt
            completedAt
            emailDeliveredAt
            isTest
            createdAt
            document {
              id
              data
            }
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
  }
`

export const GET_ASSESSMENT_RECIPIENTS_TOTAL_COUNT = gql`
  query GetAssessmentRecipientsTotalCount($getAssessmentId: ID!) {
    assessment(id: $getAssessmentId) {
      id
      assessmentResponses(first: 1) {
        totalCount
      }
    }
  }
`

export const GET_ASSESSMENT_RESPONSES_TOTAL_COUNT = gql`
  query GetAssessmentResponsesTotalCount($getAssessmentId: ID!, $where: AssessmentResponseWhereInput) {
    assessment(id: $getAssessmentId) {
      id
      assessmentResponses(first: 1, where: $where) {
        totalCount
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
