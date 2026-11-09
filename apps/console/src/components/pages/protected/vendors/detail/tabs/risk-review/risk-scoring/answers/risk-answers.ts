import {
  type CreateVendorRiskScoreInput,
  type UpdateVendorRiskScoreInput,
  type VendorRiskScoreVendorRiskImpact,
  VendorRiskScoreVendorRiskLikelihood,
  VendorRiskScoreVendorScoringAnswerType,
  type VendorRiskScoreVendorScoringCategory,
} from '@repo/codegen/src/schema'
import { type TVendorRiskScoreHistoryNode, type TVendorRiskScoringNode } from '@/lib/graphql-hooks/vendor-risk-score'
import { IMPACT_ORDER, LIKELIHOOD_ORDER, type TVendorScoringQuestionDef } from '@/lib/vendor-scoring-config'

export { IMPACT_ORDER, LIKELIHOOD_ORDER }
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { formatDate } from '@/utils/date'

export const BOOLEAN_ANSWER = { YES: 'true', NO: 'false' } as const

export const NO_RISK_LIKELIHOOD = VendorRiskScoreVendorRiskLikelihood.VERY_LOW

export type TRiskQuestion = {
  question: TVendorScoringQuestionDef
  score: TVendorRiskScoringNode | undefined
}

export type TRiskQuestionCategory = {
  category: VendorRiskScoreVendorScoringCategory
  label: string
  questions: TRiskQuestion[]
  answeredCount: number
}

type TAnswerType = Pick<TVendorScoringQuestionDef, 'answerType'>

export const hasAnswer = (score: Pick<TVendorRiskScoringNode, 'answer'> | undefined) => !!score?.answer?.trim()

export const isBooleanQuestion = (question: TAnswerType) => question.answerType === VendorRiskScoreVendorScoringAnswerType.BOOLEAN

const normalizedAnswer = (answer: string | null | undefined) => answer?.trim().toLowerCase() ?? ''

export const isYesAnswer = (question: TAnswerType, answer: string | null | undefined) => isBooleanQuestion(question) && normalizedAnswer(answer) === BOOLEAN_ANSWER.YES

export const isNoAnswer = (question: TAnswerType, answer: string | null | undefined) => isBooleanQuestion(question) && normalizedAnswer(answer) === BOOLEAN_ANSWER.NO

export const buildRiskQuestions = (questions: readonly TVendorScoringQuestionDef[], scores: readonly TVendorRiskScoringNode[]): TRiskQuestion[] => {
  const latestByKey = new Map<string, TVendorRiskScoringNode>()
  ;[...scores].sort((a, b) => (a.updatedAt ?? '').localeCompare(b.updatedAt ?? '')).forEach((score) => latestByKey.set(score.questionKey, score))

  return questions.filter((question) => question.enabled).map((question) => ({ question, score: latestByKey.get(question.key) }))
}

export const groupRiskQuestions = (items: readonly TRiskQuestion[]): TRiskQuestionCategory[] => {
  const groups = new Map<VendorRiskScoreVendorScoringCategory, TRiskQuestionCategory>()
  items.forEach((item) => {
    const category = item.question.category
    const group = groups.get(category) ?? { category, label: getEnumLabel(category), questions: [], answeredCount: 0 }
    group.questions.push(item)
    if (hasAnswer(item.score)) group.answeredCount += 1
    groups.set(category, group)
  })
  return [...groups.values()]
}

export const formatAnswer = (question: TAnswerType, answer: string | null | undefined) => {
  const value = answer?.trim()
  if (!value) return 'Not answered'
  if (!isBooleanQuestion(question)) return value
  return isYesAnswer(question, value) ? 'Yes' : 'No'
}

type TRiskAnswerDraft = {
  answer: string
  likelihood: VendorRiskScoreVendorRiskLikelihood
  impact: VendorRiskScoreVendorRiskImpact
  notes?: string
}

export const toCreateRiskScoreInput = (entityID: string, question: TVendorScoringQuestionDef, draft: TRiskAnswerDraft): CreateVendorRiskScoreInput => ({
  entityID,
  questionKey: question.key,
  questionName: question.name,
  questionCategory: question.category,
  ...(question.description ? { questionDescription: question.description } : {}),
  answer: draft.answer,
  likelihood: draft.likelihood,
  impact: draft.impact,
  ...(draft.notes?.trim() ? { notes: draft.notes.trim() } : {}),
})

export const toUpdateRiskScoreInput = (draft: Partial<TRiskAnswerDraft>): UpdateVendorRiskScoreInput => ({
  ...(draft.answer !== undefined ? { answer: draft.answer } : {}),
  ...(draft.likelihood ? { likelihood: draft.likelihood } : {}),
  ...(draft.impact ? { impact: draft.impact } : {}),
  ...(draft.notes !== undefined ? (draft.notes.trim() ? { notes: draft.notes.trim() } : { clearNotes: true }) : {}),
})

export const buildEarlierAnswers = (items: readonly TRiskQuestion[], histories: readonly TVendorRiskScoreHistoryNode[]): Map<string, string> => {
  const historiesByRef = new Map<string, TVendorRiskScoreHistoryNode[]>()
  histories.forEach((entry) => {
    if (entry.ref) historiesByRef.set(entry.ref, [...(historiesByRef.get(entry.ref) ?? []), entry])
  })

  const earlierAnswers = new Map<string, string>()
  items.forEach(({ question, score }) => {
    if (!score) return
    const earlier = (historiesByRef.get(score.id) ?? [])
      .filter((entry) => hasAnswer(entry) && (entry.answer !== score.answer || String(entry.likelihood) !== String(score.likelihood)))
      .sort((a, b) => Date.parse(b.historyTime) - Date.parse(a.historyTime))[0]
    if (!earlier) return
    const likelihood = isYesAnswer(question, earlier.answer) ? undefined : `${getEnumLabel(earlier.likelihood)} likelihood`
    earlierAnswers.set(question.key, `${[formatAnswer(question, earlier.answer), likelihood].filter(Boolean).join(' · ')}, ${formatDate(earlier.historyTime)}`)
  })
  return earlierAnswers
}
