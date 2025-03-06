import { gql } from 'graphql-request'

export const CREATE_ONBOARDING = gql`
  mutation CreateOnboarding($input: CreateOnboardingInput!) {
    createOnboarding(input: $input) {
      onboarding {
        companyDetails
        companyName
        domains
        compliance
        id
        organizationID
        userDetails
      }
    }
  }
`
