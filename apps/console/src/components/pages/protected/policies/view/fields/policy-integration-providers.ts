import { type InternalPolicyByIdFragment } from '@repo/codegen/src/schema'
import { isSafeLinkHref } from '@/lib/html/sanitize-html'
import { IntegrationFamily } from '@/lib/enums/integration'

type PolicyIntegrationProvider = {
  family: IntegrationFamily
  buildSourceUrl: (policy: InternalPolicyByIdFragment) => string | null
}

const POLICY_INTEGRATION_PROVIDERS: PolicyIntegrationProvider[] = [
  {
    family: IntegrationFamily.GOOGLE_DRIVE,
    buildSourceUrl: (policy) => {
      if (!policy.externalFileID) {
        return null
      }
      const candidate = `https://docs.google.com/document/d/${policy.externalFileID}/edit`
      return isSafeLinkHref(candidate, 'https://docs.google.com') ? candidate : null
    },
  },
  {
    family: IntegrationFamily.MICROSOFT,
    buildSourceUrl: (policy) => {
      if (!policy.url) {
        return null
      }
      const candidate = policy.url
      return isSafeLinkHref(candidate, 'https://onedrive.live.com') ? candidate : null
    },
  },
]

export const resolvePolicyIntegrationProvider = (family: string | null | undefined): PolicyIntegrationProvider | undefined =>
  family ? POLICY_INTEGRATION_PROVIDERS.find((provider) => provider.family === family) : undefined
