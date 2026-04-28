import { type IntegrationProvider } from './types'
import { normalizeIntegrationToken } from './utils'
import { Callout } from '@/components/shared/callout/callout'

const PROVIDER_HELPER_CONTENT: Record<string, React.ReactNode> = {
  cloudflare: (
    <Callout variant="info" title="Create an Account API Token in Cloudflare">
      In Cloudflare, go to <span className="font-semibold"> Manage Account &gt; API tokens</span> and add the required scopes. Ensure you do not create a User API Token.
    </Callout>
  ),
}

export const getProviderHelperContent = (provider?: Pick<IntegrationProvider, 'slug'>): React.ReactNode | null => {
  const token = normalizeIntegrationToken(provider?.slug)
  return token ? (PROVIDER_HELPER_CONTENT[token] ?? null) : null
}
