import { type InternalPolicyByIdFragment } from '@repo/codegen/src/schema'
import { isSafeLinkHref } from '@/lib/html/sanitize-html'

export type PolicyIntegrationNode = NonNullable<NonNullable<NonNullable<InternalPolicyByIdFragment['integrations']['edges']>[number]>['node']>

type PolicyIntegrationProvider = {
  family: string
  buildSourceUrl: (policy: InternalPolicyByIdFragment) => string | null
}

const POLICY_INTEGRATION_PROVIDERS: PolicyIntegrationProvider[] = [
  {
    family: 'Google Drive',
    buildSourceUrl: (policy) => {
      if (!policy.externalFileID) {
        return null
      }
      const candidate = `https://docs.google.com/document/d/${policy.externalFileID}/edit`
      return isSafeLinkHref(candidate, 'https://docs.google.com') ? candidate : null
    },
  },
]

export const resolvePolicyIntegrationProvider = (integration: PolicyIntegrationNode | null | undefined): PolicyIntegrationProvider | undefined => {
  if (!integration?.family) {
    return undefined
  }
  return POLICY_INTEGRATION_PROVIDERS.find((provider) => provider.family === integration.family)
}
