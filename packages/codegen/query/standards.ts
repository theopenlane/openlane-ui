import { gql } from 'graphql-request'

export const GET_ALL_STANDARDS = gql`
  query GetAllStandards($where: StandardWhereInput) {
    standards(where: $where) {
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
          shortName
          version
          governingBodyLogoURL
          standardType
          updatedAt
          tags
          systemOwned
          description
          domains
          controls(where: { ownerIDIsNil: true }) {
            totalCount
          }
        }
      }
    }
  }
`
export const GET_STANDARD_DETAILS = gql`
  query GetStandardDetails($standardId: ID!) {
    standard(id: $standardId) {
      id
      shortName
      version
      governingBodyLogoURL
      standardType
      updatedAt
      tags
      description
      name
      revision
      link
      framework
      governingBody
      controls(where: { ownerIDIsNil: true }) {
        totalCount
      }
    }
  }
`

export const CREATE_CONTROLS_BY_CLONE = gql`
  mutation CreateControlsByClone($input: CloneControlInput!) {
    createControlsByClone(input: $input) {
      controls {
        id
      }
    }
  }
`

export const GET_ALL_STANDARDS_SELECT = gql`
  query GetAllStandardsSelect($where: StandardWhereInput) {
    standards(where: $where) {
      edges {
        node {
          id
          shortName
        }
      }
    }
  }
`

export const GET_STANDARD_CONTROL_STATS = gql`
  query GetStandardControlStats($standardId: ID!, $isStandardSystemOwned: Boolean!) {
    standard(id: $standardId) {
      totalControlsSystemOwned: controls(where: { systemOwned: true }) @include(if: $isStandardSystemOwned) {
        totalCount
      }
      totalControlsNonSystemOwned: controls @skip(if: $isStandardSystemOwned) {
        totalCount
      }
      coveredControls: controls(where: { status: APPROVED, hasEvidenceWith: [{ status: AUDITOR_APPROVED }], systemOwned: false }) {
        totalCount
      }
      automatedControls: controls(where: { systemOwned: false, hasEvidenceWith: [{ isAutomated: true }] }) {
        totalCount
      }
    }
  }
`
