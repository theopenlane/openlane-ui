import React from 'react'
import { InfoIcon } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { cn } from '@repo/ui/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import { SeverityChip } from '@/components/shared/severity/severity-chip'
import { vendorRiskImpactLevel, vendorRiskLikelihoodLevel } from '@/lib/vendor-risk-rating'
import { formatRiskScoreAnswer, formatScoreValue, isReportReviewScore, type TRiskScoringCategory } from './risk-scoring-utils'

const QUESTION_CHIP_CLASS = 'px-1.5 py-0 text-muted-foreground'

type TRiskScoringQuestionsTableProps = {
  category: TRiskScoringCategory
}

export const RiskScoringQuestionsTable: React.FC<TRiskScoringQuestionsTableProps> = ({ category }) => (
  <Table aria-label={`${category.label} answers`}>
    <TableHeader>
      <TableRow>
        <TableHead className="min-w-56">
          <span className="inline-flex items-center">
            Question
            <SystemTooltip
              portal
              icon={<InfoIcon size={14} className="mx-1" aria-label="About question IDs" />}
              content="Each question shows its reference ID: a CSA CAIQ v4 question ID such as BCR-10.1, or a CUST- ID for a question your organization added."
            />
          </span>
        </TableHead>
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
            <div className="flex flex-col gap-1">
              <span>{score.questionName}</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className={cn(QUESTION_CHIP_CLASS, 'tabular-nums')}>
                  {score.questionKey}
                </Badge>
                {category.markReportRows && isReportReviewScore(score) && (
                  <Badge variant="outline" className={QUESTION_CHIP_CLASS}>
                    SOC 2 report
                  </Badge>
                )}
              </div>
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
