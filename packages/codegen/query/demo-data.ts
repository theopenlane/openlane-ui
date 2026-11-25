import { gql } from 'graphql-request'

export const SEED_DEMO_DATA = gql`
  mutation SeedDemoData($input: SeedDemoDataInput!) {
    seedDemoData(input: $input) {
      accepted
    }
  }
`

export const DELETE_DEMO_DATA = gql`
  mutation DeleteDemoData($input: DeleteDemoDataInput!) {
    deleteDemoData(input: $input) {
      accepted
    }
  }
`

export const GET_DEMO_DATA_TYPE_COUNTS = gql`
  query GetDemoDataTypeCounts(
    $sourceKey: String!
    $withPrograms: Boolean! = false
    $withControls: Boolean! = false
    $withEvidences: Boolean! = false
    $withInternalPolicies: Boolean! = false
    $withProcedures: Boolean! = false
    $withPlatforms: Boolean! = false
    $withSystemDetails: Boolean! = false
    $withAssets: Boolean! = false
    $withEntities: Boolean! = false
    $withIdentityHolders: Boolean! = false
    $withContacts: Boolean! = false
    $withRisks: Boolean! = false
    $withFindings: Boolean! = false
    $withVulnerabilities: Boolean! = false
    $withRemediations: Boolean! = false
    $withActionPlans: Boolean! = false
    $withReviews: Boolean! = false
    $withTasks: Boolean! = false
    $withAssessments: Boolean! = false
    $withCampaigns: Boolean! = false
    $withEmailTemplates: Boolean! = false
    $withCustomTypeEnums: Boolean! = false
    $withGroups: Boolean! = false
  ) {
    programs(where: { sourceKey: $sourceKey }) @include(if: $withPrograms) {
      totalCount
    }
    controls(where: { sourceKey: $sourceKey }) @include(if: $withControls) {
      totalCount
    }
    evidences(where: { sourceKey: $sourceKey }) @include(if: $withEvidences) {
      totalCount
    }
    internalPolicies(where: { sourceKey: $sourceKey }) @include(if: $withInternalPolicies) {
      totalCount
    }
    procedures(where: { sourceKey: $sourceKey }) @include(if: $withProcedures) {
      totalCount
    }
    platforms(where: { sourceKey: $sourceKey }) @include(if: $withPlatforms) {
      totalCount
    }
    systemDetails(where: { sourceKey: $sourceKey }) @include(if: $withSystemDetails) {
      totalCount
    }
    assets(where: { sourceKey: $sourceKey }) @include(if: $withAssets) {
      totalCount
    }
    entities(where: { sourceKey: $sourceKey }) @include(if: $withEntities) {
      totalCount
    }
    identityHolders(where: { sourceKey: $sourceKey }) @include(if: $withIdentityHolders) {
      totalCount
    }
    contacts(where: { sourceKey: $sourceKey }) @include(if: $withContacts) {
      totalCount
    }
    risks(where: { sourceKey: $sourceKey }) @include(if: $withRisks) {
      totalCount
    }
    findings(where: { sourceKey: $sourceKey }) @include(if: $withFindings) {
      totalCount
    }
    vulnerabilities(where: { sourceKey: $sourceKey }) @include(if: $withVulnerabilities) {
      totalCount
    }
    remediations(where: { sourceKey: $sourceKey }) @include(if: $withRemediations) {
      totalCount
    }
    actionPlans(where: { sourceKey: $sourceKey }) @include(if: $withActionPlans) {
      totalCount
    }
    reviews(where: { sourceKey: $sourceKey }) @include(if: $withReviews) {
      totalCount
    }
    tasks(where: { sourceKey: $sourceKey }) @include(if: $withTasks) {
      totalCount
    }
    assessments(where: { sourceKey: $sourceKey }) @include(if: $withAssessments) {
      totalCount
    }
    campaigns(where: { sourceKey: $sourceKey }) @include(if: $withCampaigns) {
      totalCount
    }
    emailTemplates(where: { sourceKey: $sourceKey }) @include(if: $withEmailTemplates) {
      totalCount
    }
    customTypeEnums(where: { sourceKey: $sourceKey }) @include(if: $withCustomTypeEnums) {
      totalCount
    }
    groups(where: { sourceKey: $sourceKey }) @include(if: $withGroups) {
      totalCount
    }
  }
`

export const GET_DEMO_DATA_COMPLIANCE_PREVIEW = gql`
  query GetDemoDataCompliancePreview(
    $sourceKey: String!
    $first: Int!
    $withPrograms: Boolean! = false
    $withControls: Boolean! = false
    $withEvidences: Boolean! = false
    $withInternalPolicies: Boolean! = false
    $withProcedures: Boolean! = false
  ) {
    programs(first: $first, where: { sourceKey: $sourceKey }) @include(if: $withPrograms) {
      edges {
        node {
          id
          name
          detail: status
        }
      }
    }
    controls(first: $first, where: { sourceKey: $sourceKey }) @include(if: $withControls) {
      edges {
        node {
          id
          refCode
          title
          detail: status
        }
      }
    }
    evidences(first: $first, where: { sourceKey: $sourceKey }) @include(if: $withEvidences) {
      edges {
        node {
          id
          name
          detail: status
        }
      }
    }
    internalPolicies(first: $first, where: { sourceKey: $sourceKey }) @include(if: $withInternalPolicies) {
      edges {
        node {
          id
          name
          detail: status
        }
      }
    }
    procedures(first: $first, where: { sourceKey: $sourceKey }) @include(if: $withProcedures) {
      edges {
        node {
          id
          name
          detail: status
        }
      }
    }
  }
`

export const GET_DEMO_DATA_REGISTRY_PREVIEW = gql`
  query GetDemoDataRegistryPreview(
    $sourceKey: String!
    $first: Int!
    $withPlatforms: Boolean! = false
    $withSystemDetails: Boolean! = false
    $withAssets: Boolean! = false
    $withEntities: Boolean! = false
    $withIdentityHolders: Boolean! = false
    $withContacts: Boolean! = false
  ) {
    platforms(first: $first, where: { sourceKey: $sourceKey }) @include(if: $withPlatforms) {
      edges {
        node {
          id
          name
          detail: status
        }
      }
    }
    systemDetails(first: $first, where: { sourceKey: $sourceKey }) @include(if: $withSystemDetails) {
      edges {
        node {
          id
          name: systemName
          detail: sensitivityLevel
        }
      }
    }
    assets(first: $first, where: { sourceKey: $sourceKey }) @include(if: $withAssets) {
      edges {
        node {
          id
          displayName
          name
          detail: assetType
        }
      }
    }
    entities(first: $first, where: { sourceKey: $sourceKey }) @include(if: $withEntities) {
      edges {
        node {
          id
          displayName
          name
          detail: status
        }
      }
    }
    identityHolders(first: $first, where: { sourceKey: $sourceKey }) @include(if: $withIdentityHolders) {
      edges {
        node {
          id
          fullName
          detail: status
        }
      }
    }
    contacts(first: $first, where: { sourceKey: $sourceKey }) @include(if: $withContacts) {
      edges {
        node {
          id
          fullName
          detail: email
        }
      }
    }
  }
`

export const GET_DEMO_DATA_EXPOSURE_PREVIEW = gql`
  query GetDemoDataExposurePreview(
    $sourceKey: String!
    $first: Int!
    $withRisks: Boolean! = false
    $withFindings: Boolean! = false
    $withVulnerabilities: Boolean! = false
    $withRemediations: Boolean! = false
    $withActionPlans: Boolean! = false
    $withReviews: Boolean! = false
  ) {
    risks(first: $first, where: { sourceKey: $sourceKey }) @include(if: $withRisks) {
      edges {
        node {
          id
          name
          detail: status
        }
      }
    }
    findings(first: $first, where: { sourceKey: $sourceKey }) @include(if: $withFindings) {
      edges {
        node {
          id
          displayName
          externalID
          detail: severity
        }
      }
    }
    vulnerabilities(first: $first, where: { sourceKey: $sourceKey }) @include(if: $withVulnerabilities) {
      edges {
        node {
          id
          cveID
          displayName
          externalID
          detail: severity
        }
      }
    }
    remediations(first: $first, where: { sourceKey: $sourceKey }) @include(if: $withRemediations) {
      edges {
        node {
          id
          title
          externalID
          detail: state
        }
      }
    }
    actionPlans(first: $first, where: { sourceKey: $sourceKey }) @include(if: $withActionPlans) {
      edges {
        node {
          id
          title
          name
          detail: status
        }
      }
    }
    reviews(first: $first, where: { sourceKey: $sourceKey }) @include(if: $withReviews) {
      edges {
        node {
          id
          title
          externalID
          detail: status
        }
      }
    }
  }
`

export const GET_DEMO_DATA_AUTOMATION_PREVIEW = gql`
  query GetDemoDataAutomationPreview(
    $sourceKey: String!
    $first: Int!
    $withTasks: Boolean! = false
    $withAssessments: Boolean! = false
    $withCampaigns: Boolean! = false
    $withEmailTemplates: Boolean! = false
  ) {
    tasks(first: $first, where: { sourceKey: $sourceKey }) @include(if: $withTasks) {
      edges {
        node {
          id
          title
          detail: status
        }
      }
    }
    assessments(first: $first, where: { sourceKey: $sourceKey }) @include(if: $withAssessments) {
      edges {
        node {
          id
          name
          detail: assessmentType
        }
      }
    }
    campaigns(first: $first, where: { sourceKey: $sourceKey }) @include(if: $withCampaigns) {
      edges {
        node {
          id
          name
          detail: status
        }
      }
    }
    emailTemplates(first: $first, where: { sourceKey: $sourceKey }) @include(if: $withEmailTemplates) {
      edges {
        node {
          id
          name
          detail: description
        }
      }
    }
  }
`

export const GET_DEMO_DATA_ORGANIZATION_SETTINGS_PREVIEW = gql`
  query GetDemoDataOrganizationSettingsPreview($sourceKey: String!, $first: Int!, $withCustomTypeEnums: Boolean! = false, $withGroups: Boolean! = false) {
    customTypeEnums(first: $first, where: { sourceKey: $sourceKey }) @include(if: $withCustomTypeEnums) {
      edges {
        node {
          id
          name
          detail: objectType
          field
        }
      }
    }
    groups(first: $first, where: { sourceKey: $sourceKey }) @include(if: $withGroups) {
      edges {
        node {
          id
          displayName
          name
          detail: description
        }
      }
    }
  }
`
