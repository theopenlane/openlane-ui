import { gql } from 'graphql-request'

export const CREATE_MAPPED_CONTROL = gql`
  mutation CreateMappedControl($input: CreateMappedControlInput!) {
    createMappedControl(input: $input) {
      mappedControl {
        id
      }
    }
  }
`

export const MAPPED_SUBCONTROLS_FRAGMENT = gql`
  fragment MappedSubcontrolsFragment on Subcontrol {
    __typename
    id
    refCode
    referenceFramework
    controlID
    category
    subcategory
  }
`

export const MAPPED_CONTROLS_FRAGMENT = gql`
  fragment MappedControlsFragment on Control {
    __typename
    id
    refCode
    referenceFramework
    category
    subcategory
  }
`

export const GET_ALL_MAPPED_CONTROLS = gql`
  query GetAllMappedControls($where: MappedControlWhereInput) {
    mappedControls(where: $where) {
      edges {
        node {
          id
          relation
          confidence
          mappingType
          source
          systemOwned
          fromSubcontrols {
            edges {
              node {
                ...MappedSubcontrolsFragment
              }
            }
          }
          toSubcontrols {
            edges {
              node {
                ...MappedSubcontrolsFragment
              }
            }
          }
          fromControls {
            edges {
              node {
                ...MappedControlsFragment
              }
            }
          }
          toControls {
            edges {
              node {
                ...MappedControlsFragment
              }
            }
          }
        }
      }
    }
  }

  ${MAPPED_SUBCONTROLS_FRAGMENT}
  ${MAPPED_CONTROLS_FRAGMENT}
`

export const GET_MAPPED_CONTROL_BY_ID = gql`
  query GetMappedControlById($mappedControlId: ID!) {
    mappedControl(id: $mappedControlId) {
      id
      relation
      confidence
      mappingType
      source
      fromSubcontrols {
        edges {
          node {
            __typename
            id
            refCode
            referenceFramework
            control {
              id
            }
          }
        }
      }
      toSubcontrols {
        edges {
          node {
            __typename
            id
            refCode
            referenceFramework
            control {
              id
            }
          }
        }
      }
      fromControls {
        edges {
          node {
            __typename
            id
            refCode
            referenceFramework
          }
        }
      }
      toControls {
        edges {
          node {
            __typename
            id
            refCode
            referenceFramework
          }
        }
      }
    }
  }
`

export const COVERAGE_CONTROL_FIELDS = gql`
  fragment CoverageControlFields on Control {
    id
    refCode
    referenceFramework
    systemOwned
    status
    evidence {
      edges {
        node {
          id
          name
          status
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
  }
`

export const COVERAGE_SUBCONTROL_FIELDS = gql`
  fragment CoverageSubcontrolFields on Subcontrol {
    id
    refCode
    referenceFramework
    controlID
    systemOwned
    status
    evidence {
      edges {
        node {
          id
          name
          status
        }
      }
    }
  }
`

export const GET_MAPPED_CONTROLS_FOR_COVERAGE = gql`
  query GetMappedControlsForCoverage($where: MappedControlWhereInput) {
    mappedControls(where: $where) {
      edges {
        node {
          fromControls {
            edges {
              node {
                ...CoverageControlFields
              }
            }
          }
          fromSubcontrols {
            edges {
              node {
                ...CoverageSubcontrolFields
              }
            }
          }
          toControls {
            edges {
              node {
                ...CoverageControlFields
              }
            }
          }
          toSubcontrols {
            edges {
              node {
                ...CoverageSubcontrolFields
              }
            }
          }
        }
      }
    }
  }

  ${COVERAGE_CONTROL_FIELDS}
  ${COVERAGE_SUBCONTROL_FIELDS}
`

export const UPDATE_MAPPED_CONTROL = gql`
  mutation updateMappedControl($updateMappedControlId: ID!, $input: UpdateMappedControlInput!) {
    updateMappedControl(id: $updateMappedControlId, input: $input) {
      mappedControl {
        id
      }
    }
  }
`

export const DELETE_MAPPED_CONTROL = gql`
  mutation DeleteMappedControl($deleteMappedControlId: ID!) {
    deleteMappedControl(id: $deleteMappedControlId) {
      deletedID
    }
  }
`
