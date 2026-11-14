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

export const GET_DEMO_DATA_PRESENCE = gql`
  query GetDemoDataPresence($sourceKey: String!) {
    programs(where: { sourceKey: $sourceKey }) {
      totalCount
    }
    controls(where: { sourceKey: $sourceKey }) {
      totalCount
    }
    internalPolicies(where: { sourceKey: $sourceKey }) {
      totalCount
    }
    procedures(where: { sourceKey: $sourceKey }) {
      totalCount
    }
    risks(where: { sourceKey: $sourceKey }) {
      totalCount
    }
    entities(where: { sourceKey: $sourceKey }) {
      totalCount
    }
    assets(where: { sourceKey: $sourceKey }) {
      totalCount
    }
    evidences(where: { sourceKey: $sourceKey }) {
      totalCount
    }
    tasks(where: { sourceKey: $sourceKey }) {
      totalCount
    }
  }
`
