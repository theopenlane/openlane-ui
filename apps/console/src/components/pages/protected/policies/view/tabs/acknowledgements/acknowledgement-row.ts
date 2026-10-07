import { type CampaignCampaignStatus } from '@repo/codegen/src/schema'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { type TPolicyAcknowledgement } from '@/lib/graphql-hooks/assessment'

export type TAcknowledgementStatus = 'draft' | 'in-progress' | 'completed'

export type TAcknowledgementRow = {
  id: string
  name: string
  revision: string | null
  dueDate: string | null
  campaignId: string | null
  campaignStatus: CampaignCampaignStatus | null
  sent: number
  completed: number
  status: TAcknowledgementStatus
}

const statusOf = (sent: number, completed: number): TAcknowledgementStatus => {
  if (sent === 0) return 'draft'
  return completed >= sent ? 'completed' : 'in-progress'
}

export const toAcknowledgementRow = (assessment: TPolicyAcknowledgement, policyId: string): TAcknowledgementRow => {
  const campaign = getNodes(assessment.campaigns)[0]
  const sent = assessment.sentResponses.totalCount
  const completed = assessment.completedResponses.totalCount

  return {
    id: assessment.id,
    name: assessment.name,
    revision: getNodes(assessment.policyAttestations).find(({ internalPolicyID }) => internalPolicyID === policyId)?.policyRevision ?? null,
    dueDate: campaign?.dueDate ?? getNodes(assessment.latestDueResponse)[0]?.dueDate ?? null,
    campaignId: campaign?.id ?? null,
    campaignStatus: campaign?.status ?? null,
    sent,
    completed,
    status: statusOf(sent, completed),
  }
}
