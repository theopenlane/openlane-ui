import { CampaignCampaignType, type Campaign, type CreateCampaignInput, type Template, type UpdateCampaignInput } from '@repo/codegen/src/schema'
import { type TAssessmentPickerOption } from '@/lib/graphql-hooks/assessment'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import { pluralizeWithCount } from '@/utils/strings'
import { getQuestionCount, getSectionCount } from './questionnaire-metrics'

export const QUESTIONNAIRE_SOURCES = ['template', 'assessment'] as const

export type TQuestionnaireSource = (typeof QUESTIONNAIRE_SOURCES)[number]

export type TQuestionnaireRef = { source: TQuestionnaireSource; id: string }

export type QuestionnaireTemplate = Pick<Template, 'id' | 'name' | 'description' | 'jsonconfig'>

export type TQuestionnaireChoice = { source: 'template'; template: QuestionnaireTemplate } | { source: 'assessment'; assessment: TAssessmentPickerOption }

export const UNAVAILABLE_QUESTIONNAIRE = 'Unavailable questionnaire'

type TCampaignQuestionnaireFields = Pick<Campaign, 'campaignType' | 'templateID' | 'assessmentID'>

export const questionnaireRefFromCampaign = ({ campaignType, templateID, assessmentID }: TCampaignQuestionnaireFields): TQuestionnaireRef | undefined => {
  if (campaignType !== CampaignCampaignType.QUESTIONNAIRE) return undefined
  if (templateID) return { source: 'template', id: templateID }
  if (assessmentID) return { source: 'assessment', id: assessmentID }
  return undefined
}

export const questionnaireRefFromChoice = (choice: TQuestionnaireChoice): TQuestionnaireRef =>
  choice.source === 'template' ? { source: 'template', id: choice.template.id } : { source: 'assessment', id: choice.assessment.id }

export const isSameQuestionnaire = (a: TQuestionnaireRef | undefined, b: TQuestionnaireRef): boolean => a?.source === b.source && a.id === b.id

export const questionnaireCreateInput = (ref: TQuestionnaireRef): Pick<CreateCampaignInput, 'campaignType' | 'templateID' | 'assessmentID'> => ({
  campaignType: CampaignCampaignType.QUESTIONNAIRE,
  ...(ref.source === 'template' ? { templateID: ref.id } : { assessmentID: ref.id }),
})

export const questionnaireUpdateInput = (ref: TQuestionnaireRef, current: TCampaignQuestionnaireFields): UpdateCampaignInput => ({
  campaignType: CampaignCampaignType.QUESTIONNAIRE,
  clearEmailTemplate: current.campaignType === CampaignCampaignType.QUESTIONNAIRE ? undefined : true,
  ...(ref.source === 'template' ? { templateID: ref.id, clearAssessment: current.templateID !== ref.id || undefined } : { assessmentID: ref.id, clearTemplate: !!current.templateID || undefined }),
})

export const questionnaireHref = (ref: TQuestionnaireRef): string => getHrefForObjectType(ref.source === 'template' ? 'templates' : 'assessments', { id: ref.id })

export const describeQuestionCount = (jsonconfig: unknown): string => pluralizeWithCount(getQuestionCount(jsonconfig), 'question')

export const describeSectionCount = (jsonconfig: unknown): string => pluralizeWithCount(getSectionCount(jsonconfig), 'section')

export const describeLinkedPolicies = (count: number): string => pluralizeWithCount(count, 'linked policy', 'linked policies')
