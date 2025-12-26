import Github from '@/assets/Github'
import Slack from '@/assets/Slack'
import { PLATFORM_DOCS_URL } from '@/constants/docs'
import { GetIntegrationsQuery } from '@repo/codegen/src/schema'

export type IntegrationTab = 'Installed' | 'Available'

type IntegrationEdges = NonNullable<NonNullable<GetIntegrationsQuery['integrations']>['edges']>

type IntegrationEdge = NonNullable<IntegrationEdges[number]>

export type IntegrationNode = NonNullable<IntegrationEdge['node']>

export type AvailableIntegrationNode = {
  id: 'github' | 'slack'
  name: string
  tags: string[]
  description: string
  Icon: React.JSX.Element
  docsUrl: string
  connectRequestBody: string
}

export const AVAILABLE_INTEGRATIONS: AvailableIntegrationNode[] = [
  {
    id: 'github',
    name: 'GitHub',
    tags: ['git', 'repository', 'gh', 'repo', 'svn', 'code'],
    description:
      'Link your GitHub repositories to automatically collect infrastructure-as-code data, identify compliance signals, and create issues when scans or tests uncover problems. Keep your workflows connected and your risks actionable.',
    Icon: <Github size={27} />,
    docsUrl: `${PLATFORM_DOCS_URL}/integrations/github`,
    connectRequestBody: JSON.stringify({
      provider: 'github',
      scopes: ['read:user', 'user:email', 'repo'],
    }),
  },
  {
    id: 'slack',
    name: 'Slack',
    tags: ['chat', 'communication'],
    description:
      'Connect Slack to receive real-time updates where your team already works. Get reminders for upcoming tasks, alerts when automated jobs fail, and notifications when new risks are detected—so nothing slips through the cracks.',
    Icon: <Slack />,
    docsUrl: `${PLATFORM_DOCS_URL}/integrations/slack`,
    connectRequestBody: JSON.stringify({
      provider: 'github',
      scopes: ['channels:read', 'chat:write', 'users:read'],
    }),
  },
]

export const getIntegrationId = (name: string) => {
  const lower = name.toLowerCase()
  if (lower.includes('github')) return 'github'
  if (lower.includes('slack')) return 'slack'
  return undefined
}
