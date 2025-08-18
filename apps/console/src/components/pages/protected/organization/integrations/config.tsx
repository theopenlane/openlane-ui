import Github from '@/assets/Github'
import Slack from '@/assets/Slack'
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
}

export const AVAILABLE_INTEGRATIONS: AvailableIntegrationNode[] = [
  {
    id: 'github',
    name: 'GitHub',
    tags: ['git', 'repository', 'gh', 'repo', 'svn', 'code'],
    description:
      'Link your GitHub repositories to automatically collect infrastructure-as-code data, identify compliance signals, and create issues when scans or tests uncover problems. Keep your workflows connected and your risks actionable.',
    Icon: <Github size={27} />,
  },
  {
    id: 'slack',
    name: 'Slack',
    tags: ['chat', 'communication'],
    description:
      'Connect Slack to receive real-time updates where your team already works. Get reminders for upcoming tasks, alerts when automated jobs fail, and notifications when new risks are detected—so nothing slips through the cracks.',
    Icon: <Slack />,
  },
]
