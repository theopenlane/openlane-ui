import { z } from 'zod'
import {
  type UpdateVendorScoringConfigInput,
  VendorRiskScoreVendorRiskImpact,
  VendorRiskScoreVendorRiskLikelihood,
  VendorRiskScoreVendorScoringAnswerType,
  VendorRiskScoreVendorScoringCategory,
  VendorScoringConfigVendorScoringMode,
} from '@repo/codegen/src/schema'
import {
  DEFAULT_VENDOR_RISK_THRESHOLDS,
  DEFAULT_VENDOR_SCORING_QUESTIONS,
  VendorRiskRating,
  type TVendorRiskRating,
  type TVendorRiskThreshold,
  type TVendorScoringQuestionDef,
  type TVendorScoringQuestionInput,
} from '@repo/codegen/src/vendor-scoring-defaults.generated'
import { isDeepEqual } from '@/utils/input-diff'
import { sortRiskThresholds } from '@/lib/vendor-risk-rating'

export { type TVendorScoringQuestionDef }

export const DEFAULT_VENDOR_SCORING_MODE = VendorScoringConfigVendorScoringMode.ANSWERED_ONLY

const DEFAULT_QUESTION_BY_KEY = new Map(DEFAULT_VENDOR_SCORING_QUESTIONS.map((question) => [question.key, question]))

const DEFAULT_MAX_SCORE_BY_RATING = new Map(DEFAULT_VENDOR_RISK_THRESHOLDS.map((threshold) => [threshold.rating, threshold.maxScore]))

export const getDefaultQuestion = (key: string) => DEFAULT_QUESTION_BY_KEY.get(key)

export const getDefaultMaxScore = (rating: TVendorRiskRating) => DEFAULT_MAX_SCORE_BY_RATING.get(rating)

export const LIKELIHOOD_ORDER: readonly VendorRiskScoreVendorRiskLikelihood[] = [
  VendorRiskScoreVendorRiskLikelihood.VERY_LOW,
  VendorRiskScoreVendorRiskLikelihood.LOW,
  VendorRiskScoreVendorRiskLikelihood.MEDIUM,
  VendorRiskScoreVendorRiskLikelihood.HIGH,
  VendorRiskScoreVendorRiskLikelihood.VERY_HIGH,
]

export const IMPACT_ORDER: readonly VendorRiskScoreVendorRiskImpact[] = [
  VendorRiskScoreVendorRiskImpact.VERY_LOW,
  VendorRiskScoreVendorRiskImpact.LOW,
  VendorRiskScoreVendorRiskImpact.MEDIUM,
  VendorRiskScoreVendorRiskImpact.HIGH,
  VendorRiskScoreVendorRiskImpact.CRITICAL,
]

export const EDITABLE_RISK_RATINGS: readonly TVendorRiskRating[] = [VendorRiskRating.VERY_LOW, VendorRiskRating.LOW, VendorRiskRating.MEDIUM, VendorRiskRating.HIGH, VendorRiskRating.CRITICAL]

const questionSchema = z.strictObject({
  key: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: z.enum(VendorRiskScoreVendorScoringCategory),
  answerType: z.enum(VendorRiskScoreVendorScoringAnswerType),
  answerOptions: z.array(z.string()).nullish(),
  suggestedImpact: z.enum(VendorRiskScoreVendorRiskImpact),
  enabled: z.boolean(),
})

const thresholdSchema = z.strictObject({
  rating: z.enum(VendorRiskRating),
  maxScore: z.number(),
})

const questionsConfigSchema = z.strictObject({ custom: z.array(questionSchema).nullish() }).nullish()

const thresholdsConfigSchema = z.strictObject({ custom: z.array(thresholdSchema).nullish() }).nullish()

export const normalizeAnswerOptions = (options: readonly string[]) => [...new Set(options.map((option) => option.trim()).filter(Boolean))]

const normalizeQuestion = ({ key, name, description, category, answerType, answerOptions, suggestedImpact, enabled }: TVendorScoringQuestionDef): TVendorScoringQuestionDef => {
  const options = answerType === VendorRiskScoreVendorScoringAnswerType.SINGLE_SELECT ? normalizeAnswerOptions(answerOptions ?? []) : undefined
  return {
    key,
    name: name.trim(),
    ...(description?.trim() ? { description: description.trim() } : {}),
    category,
    answerType,
    ...(options?.length ? { answerOptions: options } : {}),
    suggestedImpact,
    enabled,
  }
}

export type TParsedVendorScoringConfig = {
  customQuestions: TVendorScoringQuestionDef[]
  customThresholds: TVendorRiskThreshold[]
}

export const parseVendorScoringConfig = (questions: unknown, riskThresholds: unknown): { config: TParsedVendorScoringConfig | null; customThresholds: TVendorRiskThreshold[] | null } => {
  const parsedQuestions = questionsConfigSchema.safeParse(questions)
  const parsedThresholds = thresholdsConfigSchema.safeParse(riskThresholds)
  const customThresholds = parsedThresholds.success ? (parsedThresholds.data?.custom ?? []) : null

  return {
    customThresholds,
    config:
      parsedQuestions.success && customThresholds
        ? {
            customQuestions: (parsedQuestions.data?.custom ?? []).map((question) => normalizeQuestion({ ...question, answerOptions: question.answerOptions ?? undefined })),
            customThresholds,
          }
        : null,
  }
}

export const mergeVendorScoringQuestions = (customQuestions: readonly TVendorScoringQuestionDef[]): TVendorScoringQuestionDef[] => {
  const overrides = new Map(customQuestions.map((question) => [question.key, question]))
  return [...DEFAULT_VENDOR_SCORING_QUESTIONS.map((question) => overrides.get(question.key) ?? question), ...customQuestions.filter((question) => !DEFAULT_QUESTION_BY_KEY.has(question.key))]
}

export const mergeRiskThresholds = (customThresholds: readonly TVendorRiskThreshold[]): TVendorRiskThreshold[] => {
  const overrides = new Map(customThresholds.map((threshold) => [threshold.rating, threshold]))
  return sortRiskThresholds(DEFAULT_VENDOR_RISK_THRESHOLDS.map((threshold) => overrides.get(threshold.rating) ?? threshold))
}

export type TDraftQuestion = TVendorScoringQuestionDef & { draftId: string }

export type TQuestionDraftValues = Omit<TVendorScoringQuestionDef, 'key' | 'enabled'>

export type TVendorScoringDraft = {
  scoringMode: VendorScoringConfigVendorScoringMode
  questions: TDraftQuestion[]
  maxScores: Partial<Record<TVendorRiskRating, number>>
  preservedThresholds: TVendorRiskThreshold[]
}

export type TEditableQuestionField = keyof TQuestionDraftValues

const EDITABLE_QUESTION_FIELD_SET = {
  name: true,
  description: true,
  category: true,
  suggestedImpact: true,
  answerType: true,
  answerOptions: true,
} as const satisfies Record<TEditableQuestionField, true>

const EDITABLE_QUESTION_FIELDS = Object.keys(EDITABLE_QUESTION_FIELD_SET) as TEditableQuestionField[]

export const getEditedQuestionFields = (question: TQuestionDraftValues, defaultQuestion: TVendorScoringQuestionDef): ReadonlySet<TEditableQuestionField> => {
  const current = normalizeQuestion({ ...defaultQuestion, ...question })
  const original = normalizeQuestion(defaultQuestion)
  return new Set(EDITABLE_QUESTION_FIELDS.filter((field) => !isDeepEqual(current[field], original[field])))
}

export const questionOrigin = (question: TVendorScoringQuestionDef): 'default' | 'edited' | 'custom' => {
  const defaultQuestion = getDefaultQuestion(question.key)
  if (!defaultQuestion) return 'custom'
  return getEditedQuestionFields(question, defaultQuestion).size > 0 ? 'edited' : 'default'
}

const differsFromDefault = (question: TVendorScoringQuestionDef) => {
  const defaultQuestion = getDefaultQuestion(question.key)
  return !defaultQuestion || !isSameQuestion(question, defaultQuestion)
}

const isSameQuestion = (a: TVendorScoringQuestionDef, b: TVendorScoringQuestionDef) => isDeepEqual(normalizeQuestion(a), normalizeQuestion(b))

const toDraftQuestion = (question: TVendorScoringQuestionDef): TDraftQuestion => ({ ...question, draftId: question.key })

export const createVendorScoringDraft = (scoringMode: VendorScoringConfigVendorScoringMode | null | undefined, parsed: TParsedVendorScoringConfig): TVendorScoringDraft => ({
  scoringMode: scoringMode ?? DEFAULT_VENDOR_SCORING_MODE,
  questions: mergeVendorScoringQuestions(parsed.customQuestions).map(toDraftQuestion),
  maxScores: Object.fromEntries(mergeRiskThresholds(parsed.customThresholds).map(({ rating, maxScore }) => [rating, maxScore])),
  preservedThresholds: parsed.customThresholds.filter(({ rating }) => !EDITABLE_RISK_RATINGS.includes(rating)),
})

export const EMPTY_PARSED_VENDOR_SCORING_CONFIG: TParsedVendorScoringConfig = { customQuestions: [], customThresholds: [] }

const toStoredQuestion = (question: TDraftQuestion): TVendorScoringQuestionInput => {
  const { key, ...stored } = normalizeQuestion(question)
  return key ? { key, ...stored } : stored
}

const buildCustomQuestions = (questions: readonly TDraftQuestion[]) => questions.filter(differsFromDefault).map(toStoredQuestion)

const buildCustomThresholds = (maxScores: TVendorScoringDraft['maxScores']): TVendorRiskThreshold[] =>
  EDITABLE_RISK_RATINGS.flatMap((rating) => {
    const maxScore = maxScores[rating]
    return maxScore === undefined || maxScore === getDefaultMaxScore(rating) ? [] : [{ rating, maxScore }]
  })

export const buildVendorScoringConfigInput = (draft: TVendorScoringDraft): UpdateVendorScoringConfigInput => ({
  scoringMode: draft.scoringMode,
  questions: { custom: buildCustomQuestions(draft.questions) },
  riskThresholds: { custom: [...draft.preservedThresholds, ...buildCustomThresholds(draft.maxScores)] },
})

export const getRiskThresholdErrors = (maxScores: TVendorScoringDraft['maxScores']): Partial<Record<TVendorRiskRating, string>> => {
  const errors: Partial<Record<TVendorRiskRating, string>> = {}
  let previous: { rating: TVendorRiskRating; maxScore: number } | undefined

  EDITABLE_RISK_RATINGS.forEach((rating) => {
    const maxScore = maxScores[rating]
    if (maxScore === undefined || !Number.isFinite(maxScore)) {
      errors[rating] = 'Enter a score.'
      return
    }
    if (maxScore <= 0) {
      errors[rating] = 'Must be above 0.'
    } else if (previous && maxScore <= previous.maxScore) {
      errors[rating] = `Must be above ${previous.maxScore}.`
    }
    previous = { rating, maxScore }
  })

  return errors
}
