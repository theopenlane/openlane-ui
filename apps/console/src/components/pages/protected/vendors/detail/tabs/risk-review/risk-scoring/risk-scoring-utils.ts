import { type ReviewWhereInput, VendorRiskScoreVendorScoringAnswerType, type VendorRiskScoreVendorScoringCategory } from '@repo/codegen/src/schema'
import { type TVendorRiskScoringNode } from '@/lib/graphql-hooks/vendor-risk-score'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { riskRatingFromScore, type TVendorRiskRating } from '@/lib/vendor-risk-rating'

const SOC2_REPORT_REVIEW_TAG = 'soc2-report-review'

export const SOC2_REPORT_REVIEW_WHERE = { category: 'SOC 2 report', source: 'openlane_report_parse' } satisfies ReviewWhereInput

export type TRiskScoringCategory = {
  category: VendorRiskScoreVendorScoringCategory
  label: string
  score: number
  share: number
  answeredCount: number
  markReportRows: boolean
  scores: TVendorRiskScoringNode[]
}

export type TReportSource = 'none' | 'all' | 'some'

export type TRiskScoring = {
  totalScore: number
  rating: TVendorRiskRating | undefined
  answeredCount: number
  confirmedCount: number
  gapCount: number
  unansweredCount: number
  reportAnswerCount: number
  reportSource: TReportSource
  lastUpdatedAt: string | undefined
  categories: TRiskScoringCategory[]
}

const isAnswered = (score: TVendorRiskScoringNode) => !!score.answer?.trim()

const isBooleanAnswer = (score: TVendorRiskScoringNode, value: 'true' | 'false') => score.answerType === VendorRiskScoreVendorScoringAnswerType.BOOLEAN && score.answer?.trim().toLowerCase() === value

export const isReportReviewScore = (score: TVendorRiskScoringNode) => !!score.tags?.includes(SOC2_REPORT_REVIEW_TAG)

export const formatRiskScoreAnswer = (score: TVendorRiskScoringNode): string => {
  if (!isAnswered(score)) return 'Not answered'
  if (isBooleanAnswer(score, 'true')) return 'Yes'
  if (isBooleanAnswer(score, 'false')) return 'No'
  return score.answer?.trim() ?? ''
}

export const formatScoreValue = (score: number) => (Number.isInteger(score) ? String(score) : score.toFixed(1))

const toReportSource = (reportAnswerCount: number, answeredCount: number): TReportSource => {
  if (reportAnswerCount === 0) return 'none'
  return reportAnswerCount === answeredCount ? 'all' : 'some'
}

export const buildRiskScoring = (scores: TVendorRiskScoringNode[]): TRiskScoring => {
  const buckets = new Map<VendorRiskScoreVendorScoringCategory, TVendorRiskScoringNode[]>()
  let totalScore = 0
  let answeredCount = 0
  let confirmedCount = 0
  let gapCount = 0
  let reportAnswerCount = 0
  let lastUpdatedAt: string | undefined
  let lastUpdatedTime = -Infinity

  scores.forEach((score) => {
    const bucket = buckets.get(score.questionCategory)
    if (bucket) {
      bucket.push(score)
    } else {
      buckets.set(score.questionCategory, [score])
    }
    totalScore += score.score
    if (isAnswered(score)) {
      answeredCount++
      if (isReportReviewScore(score)) reportAnswerCount++
    }
    if (isBooleanAnswer(score, 'true')) confirmedCount++
    if (score.score > 0) gapCount++
    const updatedTime = score.updatedAt ? Date.parse(score.updatedAt) : NaN
    if (updatedTime > lastUpdatedTime) {
      lastUpdatedTime = updatedTime
      lastUpdatedAt = score.updatedAt
    }
  })

  const reportSource = toReportSource(reportAnswerCount, answeredCount)
  const categories = [...buckets.entries()]
    .map(([category, categoryScores]): TRiskScoringCategory => {
      const score = categoryScores.reduce((sum, item) => sum + item.score, 0)
      return {
        category,
        label: getEnumLabel(category),
        score,
        share: totalScore > 0 ? score / totalScore : 0,
        answeredCount: categoryScores.filter(isAnswered).length,
        markReportRows: reportSource === 'some',
        scores: [...categoryScores].sort((a, b) => b.score - a.score || a.questionKey.localeCompare(b.questionKey)),
      }
    })
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))

  return {
    totalScore,
    rating: riskRatingFromScore(totalScore),
    answeredCount,
    confirmedCount,
    gapCount,
    unansweredCount: scores.length - answeredCount,
    reportAnswerCount,
    reportSource,
    lastUpdatedAt,
    categories,
  }
}
