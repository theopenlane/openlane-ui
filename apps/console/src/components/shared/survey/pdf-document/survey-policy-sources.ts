import { PDF_DOCUMENT_QUESTION_TYPE } from '@theopenlane/surveyjs-components'
import type { AssessmentPoliciesInput } from '@repo/codegen/src/schema'
import { isRecord } from '@/utils/type-guards'

const NESTED_ELEMENT_KEYS = ['pages', 'elements', 'questions', 'templateElements', 'detailElements'] as const

const collectPolicySources = (node: unknown): AssessmentPoliciesInput[] => {
  if (Array.isArray(node)) return node.flatMap(collectPolicySources)
  if (!isRecord(node)) return []

  const { type, policyId, policyRevision } = node
  const own: AssessmentPoliciesInput[] =
    type === PDF_DOCUMENT_QUESTION_TYPE && typeof policyId === 'string' && policyId
      ? [{ internalPolicyID: policyId, policyRevision: typeof policyRevision === 'string' && policyRevision ? policyRevision : undefined }]
      : []

  return [...own, ...NESTED_ELEMENT_KEYS.flatMap((key) => collectPolicySources(node[key]))]
}

export const getSurveyPolicySources = (surveyJson: unknown): AssessmentPoliciesInput[] =>
  collectPolicySources(surveyJson).filter((source, index, sources) => sources.findIndex(({ internalPolicyID }) => internalPolicyID === source.internalPolicyID) === index)
