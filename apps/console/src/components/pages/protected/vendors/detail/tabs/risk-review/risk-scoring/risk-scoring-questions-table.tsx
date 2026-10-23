import React from 'react'
import { Badge } from '@repo/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import { SeverityChip } from '@/components/shared/severity/severity-chip'
import { vendorRiskImpactLevel, vendorRiskLikelihoodLevel } from '@/lib/vendor-risk-rating'
import { formatRiskScoreAnswer, formatScoreValue, isReportReviewScore, type TRiskScoringCategory } from './risk-scoring-utils'

type TRiskScoringQuestionsTableProps = {
  category: TRiskScoringCategory
}

export const RiskScoringQuestionsTable: React.FC<TRiskScoringQuestionsTableProps> = ({ category }) => (
  <Table aria-label={`${category.label} answers`}>
    <TableHeader>
      <TableRow>
        <TableHead className="min-w-56">Question</TableHead>
        <TableHead className="min-w-24">Answer</TableHead>
        <TableHead>Impact</TableHead>
        <TableHead>Likelihood</TableHead>
        <TableHead className="text-right">Score</TableHead>
        <TableHead className="min-w-48">Notes / evidence</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {category.scores.map((score) => (
        <TableRow key={score.id}>
          <TableCell className="align-top whitespace-normal">
            <div className="flex flex-col gap-0.5">
              <span>{score.questionName}</span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                {score.questionKey}
                {category.markReportRows && isReportReviewScore(score) && (
                  <Badge variant="outline" className="px-1.5 py-0 text-muted-foreground">
                    SOC 2 report
                  </Badge>
                )}
              </span>
            </div>
          </TableCell>
          <TableCell className="align-top whitespace-normal">{formatRiskScoreAnswer(score)}</TableCell>
          <TableCell className="align-top">
            <SeverityChip severity={score.impact} level={vendorRiskImpactLevel(score.impact)} className="whitespace-nowrap" />
          </TableCell>
          <TableCell className="align-top">
            <SeverityChip severity={score.likelihood} level={vendorRiskLikelihoodLevel(score.likelihood)} className="whitespace-nowrap" />
          </TableCell>
          <TableCell className="align-top text-right tabular-nums">{formatScoreValue(score.score)}</TableCell>
          <TableCell className="align-top whitespace-normal text-muted-foreground">{score.notes || '-'}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
)
