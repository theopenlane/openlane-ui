import React, { useId, useMemo } from 'react'
import { FileText } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import { OrderDirection, ReviewOrderField } from '@repo/codegen/src/schema'
import { useReviewsWithFilter, type ReviewsNodeNonNull } from '@/lib/graphql-hooks/review'
import { Callout } from '@/components/shared/callout/callout'
import EmptyTabState from '@/components/shared/crud-base/tabs/empty-tab-state'
import { SeverityChip } from '@/components/shared/severity/severity-chip'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { useVendorRiskScoring } from '@/lib/graphql-hooks/vendor-risk-score'
import { vendorRiskRatingLevel } from '@/lib/vendor-risk-rating'
import { formatDate } from '@/utils/date'
import { pluralize, pluralizeWithCount } from '@/utils/strings'
import { RiskScoreScale } from './risk-score-scale'
import { RiskScoreSources } from './risk-score-sources'
import { RiskScoringCategoryTable } from './risk-scoring-category-table'
import { buildRiskScoring, formatScoreValue, SOC2_REPORT_REVIEW_WHERE, type TRiskScoring } from './risk-scoring-utils'

type TRiskScoringPanelProps = {
  vendorId: string
  vendorRiskScore: number | null | undefined
  onViewReview: (review: ReviewsNodeNonNull) => void
}

const PaneHeading = ({ children }: { children: React.ReactNode }) => <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{children}</h4>

const answeredSuffix = (scoring: TRiskScoring) => {
  if (scoring.reportSource === 'all') return ' from the SOC 2 report'
  if (scoring.reportSource === 'some') return `, ${scoring.reportAnswerCount} from the SOC 2 report`
  return ''
}

const coverageLines = (scoring: TRiskScoring) =>
  [
    scoring.gapCount > 0 && `${pluralizeWithCount(scoring.gapCount, 'answer')} ${pluralize(scoring.gapCount, 'adds', 'add')} to the score`,
    scoring.confirmedCount > 0 && `${pluralizeWithCount(scoring.confirmedCount, 'control')} confirmed in place`,
    scoring.unansweredCount > 0 && `${pluralizeWithCount(scoring.unansweredCount, 'question')} not answered yet`,
  ].filter((line): line is string => !!line)

const ReportReviewCallout = ({ scoring }: { scoring: TRiskScoring }) => (
  <Callout variant="warning" compact>
    <span className="font-medium">
      {scoring.reportSource === 'all'
        ? "These answers come from an AI review of the vendor's SOC 2 report."
        : `${pluralizeWithCount(scoring.reportAnswerCount, 'answer')} marked SOC 2 report come from an AI review of the vendor's SOC 2 report.`}{' '}
      Check them for accuracy.
    </span>{' '}
    Their notes cite the report section each answer is based on, and the review set their impact and likelihood.
  </Callout>
)

const LATEST_REVIEW_ORDER = [{ field: ReviewOrderField.created_at, direction: OrderDirection.DESC }]
const LATEST_REVIEW_PAGINATION = { page: 1, pageSize: 1, query: { first: 1 } }

type TRiskScoringMetaProps = {
  scoring: TRiskScoring
  review: ReviewsNodeNonNull | undefined
}

const RiskScoringMeta = ({ scoring, review }: TRiskScoringMetaProps) => {
  if (scoring.reportSource === 'none') {
    return scoring.lastUpdatedAt ? <span className="text-sm text-muted-foreground">Updated {formatDate(scoring.lastUpdatedAt)}</span> : null
  }

  const reviewedAt = review?.reviewedAt ?? scoring.lastUpdatedAt
  const details = [review?.title, reviewedAt && `reviewed ${formatDate(reviewedAt)}`].filter(Boolean).join(' · ')

  return (
    <>
      <Badge variant="outline" className="shrink-0 gap-1">
        <FileText size={12} aria-hidden="true" />
        From SOC 2 report review
      </Badge>
      {details && <span className="min-w-0 break-words text-sm text-muted-foreground">{details}</span>}
    </>
  )
}

type TRiskScoringSectionProps = {
  meta?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
}

const RiskScoringSection = ({ meta, action, children }: TRiskScoringSectionProps) => {
  const headingId = useId()

  return (
    <section className="space-y-4" aria-labelledby={headingId}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex min-w-0 grow flex-wrap items-center gap-x-3 gap-y-1">
          <h3 id={headingId} className="text-lg font-semibold">
            Risk Scoring
          </h3>
          {meta}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

type TRiskScoringContentProps = Pick<TRiskScoringPanelProps, 'vendorRiskScore'> & {
  scoring: TRiskScoring
}

const RiskScoringContent = ({ scoring, vendorRiskScore }: TRiskScoringContentProps) => {
  const differsFromVendorScore = vendorRiskScore != null && vendorRiskScore !== Math.round(scoring.totalScore)
  const coverage = coverageLines(scoring)

  return (
    <>
      <Card className="grid grid-cols-1 divide-y lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1.35fr)] lg:divide-x lg:divide-y-0">
        <div className="flex flex-col gap-3 p-4">
          <PaneHeading>Answer score</PaneHeading>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-semibold tabular-nums">{formatScoreValue(scoring.totalScore)}</span>
            {scoring.rating && <SeverityChip severity={scoring.rating} level={vendorRiskRatingLevel(scoring.rating)} />}
          </div>
          <RiskScoreScale rating={scoring.rating} />
          {differsFromVendorScore && (
            <p className="text-xs text-muted-foreground">
              The vendor&apos;s risk score above is {vendorRiskScore}. It can also reflect unanswered questions, your organization&apos;s scoring settings, or a manual change.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3 p-4">
          <PaneHeading>Coverage</PaneHeading>
          <p className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums">{scoring.answeredCount}</span>
            <span className="text-sm text-muted-foreground">
              {pluralize(scoring.answeredCount, 'question')} answered{answeredSuffix(scoring)}
            </span>
          </p>
          {coverage.length > 0 && (
            <ul className="space-y-1 text-sm text-muted-foreground">
              {coverage.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-col gap-3 p-4">
          <PaneHeading>Where the score comes from</PaneHeading>
          <RiskScoreSources categories={scoring.categories} />
        </div>
      </Card>

      {scoring.reportSource !== 'none' && <ReportReviewCallout scoring={scoring} />}

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Categories are sorted by highest score first. Expand one to see its answers and notes.</p>
        <RiskScoringCategoryTable categories={scoring.categories} />
        <p className="text-xs text-muted-foreground">Score = impact × likelihood. A Yes on a yes/no question means the control is in place, so it scores 0, and so does an unanswered question.</p>
      </div>
    </>
  )
}

export const RiskScoringPanel: React.FC<TRiskScoringPanelProps> = ({ vendorId, vendorRiskScore, onViewReview }) => {
  const { data: scores, isPending, error } = useVendorRiskScoring(vendorId)
  useQueryErrorNotification({ error, description: 'Failed to load risk scoring' })
  const scoring = useMemo(() => buildRiskScoring(scores ?? []), [scores])
  const isFromReport = scoring.reportSource !== 'none'
  const {
    reviewsNodes: reportReviews,
    isPending: isReportReviewPending,
    isPlaceholderData: isReportReviewPlaceholder,
  } = useReviewsWithFilter({
    where: { hasEntitiesWith: [{ id: vendorId }], ...SOC2_REPORT_REVIEW_WHERE },
    orderBy: LATEST_REVIEW_ORDER,
    pagination: LATEST_REVIEW_PAGINATION,
    enabled: !!vendorId && isFromReport,
  })

  if (error && !scores) {
    return (
      <RiskScoringSection>
        <EmptyTabState title="Risk scoring could not be loaded" description="Please try again later." />
      </RiskScoringSection>
    )
  }
  if (isPending || (isFromReport && (isReportReviewPending || isReportReviewPlaceholder)) || scoring.categories.length === 0) {
    return null
  }

  const reportReview = isFromReport ? reportReviews[0] : undefined

  return (
    <RiskScoringSection
      meta={<RiskScoringMeta scoring={scoring} review={reportReview} />}
      action={
        reportReview && (
          <Button type="button" variant="secondary" onClick={() => onViewReview(reportReview)}>
            View Review
          </Button>
        )
      }
    >
      <RiskScoringContent scoring={scoring} vendorRiskScore={vendorRiskScore} />
    </RiskScoringSection>
  )
}
