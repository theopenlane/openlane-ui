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

export const CREATE_ASSESSMENT_WITH_POLICIES = gql`
  mutation CreateAssessmentWithPolicies($assessmentInput: CreateAssessmentInput!, $policies: [AssessmentPoliciesInput!]) {
    createAssessmentWithPolicies(assessmentInput: $assessmentInput, policies: $policies) {
      assessment {
        id
        name
        responseDueDuration
      }
    }
  }
`

export const GET_ASSESSMENT_POLICY_ATTESTATIONS = gql`
  query GetAssessmentPolicyAttestations($assessmentId: ID!) {
    assessment(id: $assessmentId) {
      id
      policyAttestations(first: 100) {
        edges {
          node {
            id
            internalPolicyID
            policyRevision
          }
        }
      }
    }
  }
`

export const GET_POLICY_ACKNOWLEDGEMENTS = gql`
  query GetPolicyAcknowledgements($policyId: ID!, $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    internalPolicy(id: $policyId) {
      id
      assessments(first: $first, after: $after, last: $last, before: $before, orderBy: [{ field: created_at, direction: DESC }]) {
        totalCount
        pageInfo {
          startCursor
          endCursor
          hasPreviousPage
          hasNextPage
        }
        edges {
          node {
            id
            name
            policyAttestations(first: 100) {
              edges {
                node {
                  internalPolicyID
                  policyRevision
                }
              }
            }
            campaigns(first: 1, orderBy: [{ field: created_at, direction: DESC }]) {
              edges {
                node {
                  id
                  status
                  dueDate
                }
              }
            }
            sentResponses: assessmentResponses(where: { isTest: false }) {
              totalCount
            }
            completedResponses: assessmentResponses(where: { isTest: false, status: COMPLETED }) {
              totalCount
            }
            latestDueResponse: assessmentResponses(where: { isTest: false, dueDateNotNil: true }, first: 1, orderBy: [{ field: due_date, direction: DESC }]) {
              edges {
                node {
                  dueDate
                }
              }
            }
          }
        }
      }
    }
  }
`

export const GET_ASSESSMENT_RESPONSES_PAGE = gql`
  query GetAssessmentResponsesPage(
    $assessmentId: ID!
    $where: AssessmentResponseWhereInput
    $orderBy: [AssessmentResponseOrder!]
    $first: Int
    $after: Cursor
    $last: Int
    $before: Cursor
    $withDocument: Boolean! = true
  ) {
    assessment(id: $assessmentId) {
      id
      assessmentResponses(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
        totalCount
        pageInfo {
          startCursor
          endCursor
          hasPreviousPage
          hasNextPage
        }
        edges {
          node {
            id
            email
            displayName
            status
            sendAttempts
            assignedAt
            dueDate
            completedAt
            emailDeliveredAt
            identityHolder {
              id
              fullName
            }
            document @include(if: $withDocument) {
              id
              data
            }
          }
        }
      }
    }
  }
`

export const GET_POLICY_ACKNOWLEDGEMENT_COUNT = gql`
  query GetPolicyAcknowledgementCount($policyId: ID!) {
    internalPolicy(id: $policyId) {
      id
      assessments {
        totalCount
      }
    }
  }
`

export const GET_ASSESSMENT_JSONCONFIG = gql`
  query GetAssessmentJsonconfig($assessmentId: ID!) {
    assessment(id: $assessmentId) {
      id
      jsonconfig
    }
  }
`

export const CREATE_BULK_ASSESSMENT_POLICY = gql`
  mutation CreateBulkAssessmentPolicy($input: [CreateAssessmentPolicyInput!]) {
    createBulkAssessmentPolicy(input: $input) {
      assessmentPolicies {
        id
      }
    }
  }
`

export const DELETE_BULK_ASSESSMENT_POLICY = gql`
  mutation DeleteBulkAssessmentPolicy($ids: [ID!]!) {
    deleteBulkAssessmentPolicy(ids: $ids) {
      deletedIDs
      notDeletedIDs
      error
    }
  }
`

export const CREATE_ASSESSMENT_TEMPLATE = gql`
  mutation CreateAssessmentTemplate($input: CreateAssessmentTemplateInput!) {
    createAssessmentTemplate(input: $input) {
      template {
        id
        name
        description
        tags
      }
    }
  }
`

export const GET_ASSESSMENT_BY_ID_MINIFIED = gql`
  query GetAssessmentByIdMinified($getAssessmentId: ID!) {
    assessment(id: $getAssessmentId) {
      id
      name
    }
  }
`

export const GET_ASSESSMENT = gql`
  query GetAssessment($getAssessmentId: ID!) {
    assessment(id: $getAssessmentId) {
      id
      name
      assessmentType
      systemOwned
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
          systemOwned
          templateID
          template {
            id
            name
            kind
          }
          jsonconfig
          responseDueDuration
          tags
          createdAt
          updatedAt
          createdBy
          updatedBy
          assessmentResponses(where: { isTest: false }, first: 1) {
            totalCount
          }
          completedAssessmentResponses: assessmentResponses(where: { status: COMPLETED, isTest: false }, first: 1) {
            totalCount
          }
          campaigns {
            edges {
              node {
                id
                entityID
              }
            }
          }
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
      systemOwned
      jsonconfig
      uischema
      templateID
      responseDueDuration
      tags
      createdAt
      updatedAt
      campaigns {
        edges {
          node {
            id
            entityID
          }
        }
      }
      assessmentResponses(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
        totalCount
        edges {
          node {
            id
            email
            displayName
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

export const GET_ASSESSMENT_ACCESS_URL = gql`
  query GetAssessmentAccessURL($getAssessmentId: ID!) {
    assessment(id: $getAssessmentId) {
      id
      accessURL
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
      notDeletedIDs
      error
    }
  }
`
