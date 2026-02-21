import { gql } from 'graphql-request'

export const SEARCH = gql`
  query Search($query: String!) {
    search(query: $query) {
      searchContext {
        entityID
        entityType
        matchedFields
        snippets {
          field
          text
        }
      }
    }
  }
`

export const SEARCH_CONTEXT_LABELS = gql`
  query SearchContextLabels(
    $controlsWhere: ControlWhereInput
    $controlsFirst: Int
    $includeControls: Boolean!
    $subcontrolsWhere: SubcontrolWhereInput
    $subcontrolsFirst: Int
    $includeSubcontrols: Boolean!
    $internalPoliciesWhere: InternalPolicyWhereInput
    $internalPoliciesFirst: Int
    $includeInternalPolicies: Boolean!
    $proceduresWhere: ProcedureWhereInput
    $proceduresFirst: Int
    $includeProcedures: Boolean!
    $programsWhere: ProgramWhereInput
    $programsFirst: Int
    $includePrograms: Boolean!
    $tasksWhere: TaskWhereInput
    $tasksFirst: Int
    $includeTasks: Boolean!
    $risksWhere: RiskWhereInput
    $risksFirst: Int
    $includeRisks: Boolean!
    $groupsWhere: GroupWhereInput
    $groupsFirst: Int
    $includeGroups: Boolean!
    $organizationsWhere: OrganizationWhereInput
    $organizationsFirst: Int
    $includeOrganizations: Boolean!
  ) {
    controls(where: $controlsWhere, first: $controlsFirst) @include(if: $includeControls) {
      edges {
        node {
          id
          refCode
          ownerID
        }
      }
    }
    subcontrols(where: $subcontrolsWhere, first: $subcontrolsFirst) @include(if: $includeSubcontrols) {
      edges {
        node {
          id
          refCode
          control {
            id
          }
        }
      }
    }
    internalPolicies(where: $internalPoliciesWhere, first: $internalPoliciesFirst) @include(if: $includeInternalPolicies) {
      edges {
        node {
          id
          name
        }
      }
    }
    procedures(where: $proceduresWhere, first: $proceduresFirst) @include(if: $includeProcedures) {
      edges {
        node {
          id
          name
        }
      }
    }
    programs(where: $programsWhere, first: $programsFirst) @include(if: $includePrograms) {
      edges {
        node {
          id
          name
        }
      }
    }
    tasks(where: $tasksWhere, first: $tasksFirst) @include(if: $includeTasks) {
      edges {
        node {
          id
          title
        }
      }
    }
    risks(where: $risksWhere, first: $risksFirst) @include(if: $includeRisks) {
      edges {
        node {
          id
          name
        }
      }
    }
    groups(where: $groupsWhere, first: $groupsFirst) @include(if: $includeGroups) {
      edges {
        node {
          id
          displayName
          name
        }
      }
    }
    organizations(where: $organizationsWhere, first: $organizationsFirst) @include(if: $includeOrganizations) {
      edges {
        node {
          id
          displayName
          name
        }
      }
    }
  }
`
