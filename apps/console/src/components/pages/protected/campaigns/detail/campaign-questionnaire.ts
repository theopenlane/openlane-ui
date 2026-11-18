import { type CampaignQuery } from '@repo/codegen/src/schema'
import { describeLinkedPolicies, describeQuestionCount, questionnaireRefFromCampaign, type TQuestionnaireRef, UNAVAILABLE_QUESTIONNAIRE } from '../questionnaire-source'

export type TCampaignQuestionnaire = {
  ref: TQuestionnaireRef
  heading: string
  name: string
  updatedAt?: string
  detailLabel: string
  detail: string
}

export const getCampaignQuestionnaire = (campaign: CampaignQuery['campaign']): TCampaignQuestionnaire | undefined => {
  const ref = questionnaireRefFromCampaign(campaign)
  if (!ref) return undefined

  if (ref.source === 'template') {
    const { template } = campaign
    return {
      ref,
      heading: 'Questionnaire Template',
      name: template?.name ?? UNAVAILABLE_QUESTIONNAIRE,
      updatedAt: template?.updatedAt,
      detailLabel: 'Questions',
      detail: template ? describeQuestionCount(template.jsonconfig) : '—',
    }
  }

  const { assessment } = campaign
  return {
    ref,
    heading: 'Questionnaire',
    name: assessment?.name ?? UNAVAILABLE_QUESTIONNAIRE,
    updatedAt: assessment?.updatedAt,
    detailLabel: 'Linked policies',
    detail: assessment ? describeLinkedPolicies(assessment.internalPolicies.totalCount) : '—',
  }
}
