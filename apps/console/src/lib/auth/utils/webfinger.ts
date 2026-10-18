import 'server-only'
import { openlaneAPIUrl } from '@repo/dally/auth'

const WEBFINGER_TIMEOUT_MS = 5000 // 5s

export interface WebfingerConfig {
  success: boolean
  enforced: boolean
  provider?: string
  organization_id?: string
  is_org_owner?: boolean
}

type TSSOWebfingerConfig = WebfingerConfig & { provider: string; organization_id: string }

export const fetchWebfinger = async (email: string): Promise<WebfingerConfig | null> => {
  try {
    const webfingerResponse = await fetch(`${openlaneAPIUrl}/.well-known/webfinger?resource=acct:${encodeURIComponent(email)}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(WEBFINGER_TIMEOUT_MS),
    })

    if (!webfingerResponse.ok) {
      return null
    }

    const config: WebfingerConfig = await webfingerResponse.json()

    return config.success ? config : null
  } catch (error) {
    console.error('failed to check webfinger:', error)
    return null
  }
}

export const hasUsableSSO = (config: WebfingerConfig): config is TSSOWebfingerConfig => Boolean(config.provider) && config.provider !== 'NONE' && Boolean(config.organization_id)

export const checkWebfinger = async (email: string): Promise<TSSOWebfingerConfig | null> => {
  const config = await fetchWebfinger(email)

  return config?.enforced && hasUsableSSO(config) ? config : null
}

export const resolveSSOOrganizationId = async (email: string): Promise<string | null> => {
  const config = await fetchWebfinger(email)

  return config && hasUsableSSO(config) ? config.organization_id : null
}
