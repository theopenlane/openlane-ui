import { gql } from 'graphql-request'

export const GET_PROGRAM_WORK_TASKS = gql`
  query GetProgramWorkTasks($where: TaskWhereInput, $first: Int, $orderBy: [TaskOrder!]) {
    tasks(where: $where, first: $first, orderBy: $orderBy) {
      totalCount
      edges {
        node {
          id
          title
          status
          due
          createdAt
          assignee {
            id
            displayName
            avatarRemoteURL
            avatarFile {
              base64
            }
          }
          controls(first: 1) {
            edges {
              node {
                id
                refCode
              }
            }
          }
          internalPolicies(first: 1) {
            edges {
              node {
                id
                name
              }
            }
          }
          procedures(first: 1) {
            edges {
              node {
                id
                name
              }
            }
          }
          evidence(first: 1) {
            edges {
              node {
                id
                name
              }
            }
          }
        }
      }
    }
  }
`

export const GET_PROGRAM_WORK_CONTROLS = gql`
  query GetProgramWorkControls($where: ControlWhereInput, $first: Int, $orderBy: [ControlOrder!]) {
    controls(where: $where, first: $first, orderBy: $orderBy) {
      totalCount
      edges {
        node {
          id
          refCode
          title
          status
          referenceFramework
          createdAt
          controlOwner {
            id
            displayName
            logoURL
            gravatarLogoURL
          }
        }
      }
    }
  }
`

export const GET_PROGRAM_WORK_EVIDENCES = gql`
  query GetProgramWorkEvidences($where: EvidenceWhereInput, $first: Int, $orderBy: [EvidenceOrder!]) {
    evidences(where: $where, first: $first, orderBy: $orderBy) {
      totalCount
      edges {
        node {
          id
          name
          status
          createdAt
          controls(first: 3) {
            edges {
              node {
                id
                refCode
                controlOwner {
                  id
                  displayName
                  logoURL
                  gravatarLogoURL
                }
              }
            }
          }
        }
      }
    }
  }
`

export const GET_PROGRAM_WORK_INTERNAL_POLICIES = gql`
  query GetProgramWorkInternalPolicies($where: InternalPolicyWhereInput, $first: Int, $orderBy: [InternalPolicyOrder!]) {
    internalPolicies(where: $where, first: $first, orderBy: $orderBy) {
      totalCount
      edges {
        node {
          id
          name
          status
          createdAt
          approver {
            id
            displayName
            logoURL
            gravatarLogoURL
          }
          controls(first: 1) {
            edges {
              node {
                id
                refCode
              }
            }
          }
        }
      }
    }
  }
`

export const GET_PROGRAM_WORK_PROCEDURES = gql`
  query GetProgramWorkProcedures($where: ProcedureWhereInput, $first: Int, $orderBy: [ProcedureOrder!]) {
    procedures(where: $where, first: $first, orderBy: $orderBy) {
      totalCount
      edges {
        node {
          id
          name
          status
          createdAt
          approver {
            id
            displayName
            logoURL
            gravatarLogoURL
          }
          controls(first: 1) {
            edges {
              node {
                id
                refCode
              }
            }
          }
        }
      }
    }
  }
`
