import { VendorRiskScoreVendorScoringAnswerType, VendorScoringConfigVendorScoringMode } from '@repo/codegen/src/schema'

export const SCORING_MODE_COPY: Record<VendorScoringConfigVendorScoringMode, { label: string; description: string }> = {
  [VendorScoringConfigVendorScoringMode.ANSWERED_ONLY]: {
    label: 'Ignore unanswered questions',
    description: 'Only answered questions add to the score. Good when vendors fill things out over time.',
  },
  [VendorScoringConfigVendorScoringMode.FULL_QUESTIONNAIRE]: {
    label: 'Count unanswered as highest risk',
    description: 'Each unanswered question adds the maximum score. Use when every vendor must answer everything.',
  },
  [VendorScoringConfigVendorScoringMode.MANUAL]: {
    label: 'Set ratings by hand',
    description: "Answers are kept, but scores aren't totaled. You set each vendor's rating yourself.",
  },
}

export const SCORING_MODE_ORDER: readonly VendorScoringConfigVendorScoringMode[] = [
  VendorScoringConfigVendorScoringMode.ANSWERED_ONLY,
  VendorScoringConfigVendorScoringMode.FULL_QUESTIONNAIRE,
  VendorScoringConfigVendorScoringMode.MANUAL,
]

export const ANSWER_TYPE_COPY: Record<VendorRiskScoreVendorScoringAnswerType, { label: string; hint: string }> = {
  [VendorRiskScoreVendorScoringAnswerType.BOOLEAN]: { label: 'Yes / No', hint: '"Yes" adds no risk' },
  [VendorRiskScoreVendorScoringAnswerType.SINGLE_SELECT]: { label: 'Pick one', hint: 'From a list' },
  [VendorRiskScoreVendorScoringAnswerType.TEXT]: { label: 'Text', hint: 'Free answer' },
  [VendorRiskScoreVendorScoringAnswerType.NUMERIC]: { label: 'Number', hint: 'e.g. hours, days' },
}

export const ANSWER_TYPE_ORDER: readonly VendorRiskScoreVendorScoringAnswerType[] = [
  VendorRiskScoreVendorScoringAnswerType.BOOLEAN,
  VendorRiskScoreVendorScoringAnswerType.SINGLE_SELECT,
  VendorRiskScoreVendorScoringAnswerType.TEXT,
  VendorRiskScoreVendorScoringAnswerType.NUMERIC,
]
