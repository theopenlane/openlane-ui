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
  query GetAllPrograms($where: ProgramWhereInput, $orderBy: [ProgramOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    programs(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
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
            role
            displayName
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
              displayName
              id
              email
            }
            assigner {
              displayName
              id
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
      displayID
      tags
      frameworkName
      status
      programKindName
      programOwnerID
    }
  }
`

export const GET_PROGRAM_SETTINGS = gql`
  query GetProgramSettings($programId: ID!) {
    program(id: $programId) {
      viewers {
        edges {
          node {
            id
            displayName
            gravatarLogoURL
            logoURL
          }
        }
      }
      editors {
        edges {
          node {
            id
            displayName
            gravatarLogoURL
            logoURL
          }
        }
      }
      members {
        totalCount
        edges {
          node {
            id
            role
            user {
              email
              id
              displayName
              avatarRemoteURL
              avatarFile {
                id
                presignedURL
              }
            }
          }
        }
      }
    }
  }
`
export const GET_PROGRAM_MEMBERS = gql`
  query GetProgramMembers($after: Cursor, $first: Int, $before: Cursor, $last: Int, $where: ProgramMembershipWhereInput) {
    programMemberships(after: $after, first: $first, before: $before, last: $last, where: $where) {
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
      totalCount
      edges {
        node {
          id
          role
          user {
            id
            displayName
            email
            avatarFile {
              presignedURL
            }
            avatarRemoteURL
          }
        }
      }
    }
  }
`

export const GET_PROGRAM_GROUPS = gql`
  query GetProgramGroups($programId: ID!) {
    program(id: $programId) {
      id
      viewers {
        totalCount
        edges {
          node {
            name
            id
            gravatarLogoURL
            logoURL
            members {
              totalCount
            }
          }
        }
      }
      editors {
        totalCount
        edges {
          node {
            name
            id
            gravatarLogoURL
            logoURL
            members {
              totalCount
            }
          }
        }
      }
    }
  }
`

export const DELETE_PROGRAM = gql`
  mutation DeleteProgram($deleteProgramId: ID!) {
    deleteProgram(id: $deleteProgramId) {
      deletedID
    }
  }
`

export const UPDATE_PROGRAM_MEMBERSHIP = gql`
  mutation UpdateProgramMembership($updateProgramMembershipId: ID!, $input: UpdateProgramMembershipInput!) {
    updateProgramMembership(id: $updateProgramMembershipId, input: $input) {
      programMembership {
        id
      }
    }
  }
`

export const GET_EVIDENCE_STATS = gql`
  query GetEvidenceStats($programId: ID!) {
    totalControls: controls(where: { systemOwned: false, hasProgramsWith: [{ id: $programId }] }) {
      totalCount
    }

    submitted: controls(where: { hasEvidenceWith: [{ statusIn: [READY_FOR_AUDITOR], hasProgramsWith: [{ id: $programId }] }] }) {
      totalCount
    }

    accepted: controls(where: { hasEvidenceWith: [{ statusIn: [AUDITOR_APPROVED], hasProgramsWith: [{ id: $programId }] }] }) {
      totalCount
    }

    rejected: controls(where: { hasEvidenceWith: [{ statusIn: [REJECTED], hasProgramsWith: [{ id: $programId }] }] }) {
      totalCount
    }
  }
`

export const GET_GLOBAL_EVIDENCE_STATS = gql`
  query GetGlobalEvidenceStats {
    totalControls: controls(where: { systemOwned: false }) {
      totalCount
    }

    submitted: controls(where: { systemOwned: false, hasEvidenceWith: [{ statusIn: [READY_FOR_AUDITOR] }] }) {
      totalCount
    }

    accepted: controls(where: { systemOwned: false, hasEvidenceWith: [{ statusIn: [AUDITOR_APPROVED] }] }) {
      totalCount
    }

    rejected: controls(where: { systemOwned: false, hasEvidenceWith: [{ statusIn: [REJECTED] }] }) {
      totalCount
    }
  }
`

export const GET_PROGRAM_DASHBOARD = gql`
  query GetProgramDashboard($where: ProgramWhereInput) {
    programs(where: $where) {
      edges {
        node {
          id
          name
          frameworkName
          description
          status
          endDate
          startDate
          programOwner {
            id
            displayName
          }
          submittedEvidences: controls(where: { hasEvidenceWith: [{ statusIn: [READY_FOR_AUDITOR, AUDITOR_APPROVED] }] }) {
            totalCount
          }
          tasks {
            edges {
              node {
                id
                status
              }
            }
          }
          controls {
            totalCount
          }
        }
      }
    }
  }
`
