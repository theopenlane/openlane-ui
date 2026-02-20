import Github from '@/assets/Github'
import Slack from '@/assets/Slack'
import { Plug } from 'lucide-react'
import { PLATFORM_DOCS_URL } from '@/constants/docs'
import { GetIntegrationsQuery } from '@repo/codegen/src/schema'

export type IntegrationTab = 'Installed' | 'Available'

type IntegrationEdges = NonNullable<NonNullable<GetIntegrationsQuery['integrations']>['edges']>

type IntegrationEdge = NonNullable<IntegrationEdges[number]>

export type IntegrationNode = NonNullable<IntegrationEdge['node']>

export type AvailableIntegrationNode = {
  id: string
  name: string
  tags: string[]
  description: string
  Icon: React.JSX.Element
  docsUrl: string
  connectRequestBody: string
}

export type IntegrationProvider = {
  name: string
  displayName: string
  category: string
  authType: string
  active: boolean
  logoUrl?: string
  docsUrl: string
  oauth?: {
    scopes?: string[]
    [key: string]: unknown
  }
  labels?: Record<string, string>
}

export type IntegrationProvidersResponse = {
  providers: IntegrationProvider[]
}

const PROVIDER_ICON_MAP: Record<string, React.JSX.Element> = {
  github: <Github size={27} />,
  slack: <Slack />,
}

function getProviderIcon(name: string): React.JSX.Element {
  return PROVIDER_ICON_MAP[name.toLowerCase()] ?? <Plug size={27} />
}

export function toAvailableIntegration(provider: IntegrationProvider): AvailableIntegrationNode {
  const id = provider.name.toLowerCase()
  const tags: string[] = [provider.category, ...Object.values(provider.labels ?? {})].filter(Boolean)
  return {
    id,
    name: provider.displayName,
    tags,
    description: '',
    Icon: getProviderIcon(id),
    docsUrl: provider.docsUrl || `${PLATFORM_DOCS_URL}/integrations/${id}`,
    connectRequestBody: JSON.stringify({
      provider: provider.name,
      scopes: provider.oauth?.scopes ?? [],
    }),
  }
}

export function getInstalledIntegrationConfig(name: string, providers: IntegrationProvider[]): { Icon: React.JSX.Element; docsUrl: string } | undefined {
  const lower = name.toLowerCase()
  const provider = providers.find((p) => lower.includes(p.name.toLowerCase()))
  if (!provider) return undefined
  const id = provider.name.toLowerCase()
  return {
    Icon: getProviderIcon(id),
    docsUrl: provider.docsUrl || `${PLATFORM_DOCS_URL}/integrations/${id}`,
  }
}
