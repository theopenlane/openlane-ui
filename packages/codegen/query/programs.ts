import { gql } from 'graphql-request'

export const CREATE_PROGRAM_WITH_MEMBERS = gql`
  mutation CreateProgramWithMembers($input: CreateProgramWithMembersInput!) {
    createProgramWithMembers(input: $input) {
      program {
        id
        name
      }
    }
  }
`

export const UPDATE_PROGRAM = gql`
  mutation UpdateProgram($updateProgramId: ID!, $input: UpdateProgramInput!) {
    updateProgram(id: $updateProgramId, input: $input) {
      program {
        id
        name
      }
    }
  }
`

export const GET_ALL_PROGRAMS = gql`
  query GetAllPrograms($where: ProgramWhereInput, $orderBy: [ProgramOrder!]) {
    programs(where: $where, orderBy: $orderBy) {
      edges {
        node {
          id
          name
          description
          tags
          status
          startDate
          endDate
          auditorReady
          displayID
        }
      }
    }
  }
`

export const GET_PROGRAM_EDGES_FOR_WIZARD = gql`
  query GetProgramEdgesForWizard {
    risks {
      edges {
        node {
          id
          name
        }
      }
    }
    procedures {
      edges {
        node {
          id
          name
        }
      }
    }
    internalPolicies {
      edges {
        node {
          id
          name
        }
      }
    }
    groups {
      edges {
        node {
          id
          name
          displayName
        }
      }
    }
    orgMemberships {
      edges {
        node {
          user {
            id
            firstName
            lastName
            role
          }
        }
      }
    }
  }
`

export const GET_PROGRAM_DETAILS_BY_ID = gql`
  query GetProgramDetailsById($programId: ID!) {
    program(id: $programId) {
      id
      name
      description
      tags
      status
      startDate
      endDate
      auditorReady
      auditorWriteComments
      auditorReadComments
      tasks {
        edges {
          node {
            id
            title
            status
            due
            details
            assignee {
              id
              firstName
              lastName
              email
            }
            assigner {
              id
              firstName
              lastName
              email
            }
          }
        }
      }
      controlObjectives {
        edges {
          node {
            id
            name
          }
        }
      }
      controls {
        edges {
          node {
            id
          }
        }
      }
      subcontrols {
        edges {
          node {
            id
          }
        }
      }
      narratives {
        edges {
          node {
            id
            name
          }
        }
      }
      internalPolicies {
        edges {
          node {
            id
            name
          }
        }
      }
      procedures {
        edges {
          node {
            id
            name
          }
        }
      }
    }
  }
`

export const GET_PROGRAM_BASIC_INFO = gql`
  query GetProgramBasicInfo($programId: ID!) {
    program(id: $programId) {
      name
      startDate
      endDate
      description
      auditFirm
      auditor
      auditorEmail
      auditorReady
    }
  }
`

export const GET_EVIDENCE_STATS = gql`
  query GetEvidenceStats($programId: ID!) {
    totalControls: controls(where: { hasProgramsWith: [{ id: $programId }] }) {
      totalCount
    }
    submitted: controls(where: { hasProgramsWith: [{ id: $programId }], hasEvidenceWith: [{ statusIn: READY }] }) {
      totalCount
    }
    accepted: controls(where: { hasProgramsWith: [{ id: $programId }], hasEvidenceWith: [{ statusIn: APPROVED }] }) {
      totalCount
    }
    overdue: controls(where: { hasProgramsWith: [{ id: $programId }], hasEvidenceWith: [{ statusNotIn: [APPROVED, READY] }], statusNotIn: [ARCHIVED, APPROVED] }) {
      totalCount
    }
  }
`

export const GET_GLOBAL_EVIDENCE_STATS = gql`
  query GetGlobalEvidenceStats {
    totalControls: controls(where: {}) {
      totalCount
    }
    submitted: controls(where: { hasEvidenceWith: [{ statusIn: READY }] }) {
      totalCount
    }
    accepted: controls(where: { hasEvidenceWith: [{ statusIn: APPROVED }] }) {
      totalCount
    }
    overdue: controls(where: { hasEvidenceWith: [{ statusNotIn: [APPROVED, READY] }], statusNotIn: [ARCHIVED, APPROVED] }) {
      totalCount
    }
  }
`
