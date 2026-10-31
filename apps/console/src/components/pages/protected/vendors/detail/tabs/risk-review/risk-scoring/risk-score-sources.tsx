import React from 'react'
import { TruncatedCell } from '@repo/ui/truncated-cell'
import { LinearBar } from '@/components/shared/linear-bar/linear-bar'
import { formatScoreValue, type TRiskScoringCategory } from './risk-scoring-utils'

type TRiskScoreSourcesProps = {
  categories: TRiskScoringCategory[]
}

export const RiskScoreSources: React.FC<TRiskScoreSourcesProps> = ({ categories }) => (
  <ul className="flex flex-col gap-2">
    {categories.map((category) => (
      <li key={category.category} className="grid grid-cols-[minmax(0,11rem)_minmax(2rem,1fr)_auto] items-center gap-3 text-sm">
        <TruncatedCell portal>{category.label}</TruncatedCell>
        <LinearBar role="meter" value={category.share} label={`${category.label} share of the score`} />
        <span className="text-right tabular-nums text-muted-foreground">
          {formatScoreValue(category.score)}
          {category.score > 0 && <span className="ml-1">· {Math.round(category.share * 100)}%</span>}
        </span>
      </li>
    ))}
  </ul>
)
