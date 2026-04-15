import { Alert, AlertDescription, AlertTitle } from '@repo/ui/alert'
import { InfoIcon } from 'lucide-react'
import { type IntegrationProvider } from './types'
import { normalizeIntegrationToken } from './utils'

const PROVIDER_HELPER_CONTENT: Record<string, React.ReactNode> = {
  cloudflare: (
    <Alert className="border-border/60 bg-muted/20">
      <InfoIcon className="h-4 w-4" />
      <AlertTitle>Create a Customer API Token in Cloudflare (do not use a Global API Key or Account Admin token).</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>Ensure the token includes the following permissions:</p>
        <ul className="list-disc pl-5">
          <li>Access: User Read</li>
          <li>Account Settings: Read</li>
        </ul>
      </AlertDescription>
    </Alert>
  ),
}

export const getProviderHelperContent = (provider?: Pick<IntegrationProvider, 'slug'>): React.ReactNode | null => {
  const token = normalizeIntegrationToken(provider?.slug)
  return token ? (PROVIDER_HELPER_CONTENT[token] ?? null) : null
}
