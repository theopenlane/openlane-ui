'use client'

import React from 'react'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import { Badge } from '@repo/ui/badge'
import { RadioGroup, RadioGroupItem } from '@repo/ui/radio-group'
import { cn } from '@repo/ui/lib/utils'
import { VendorScoringConfigVendorScoringMode } from '@repo/codegen/src/schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { Callout } from '@/components/shared/callout/callout'
import { DEFAULT_VENDOR_SCORING_MODE, EDITABLE_RISK_RATINGS, getDefaultMaxScore, type TVendorScoringDraft } from '@/lib/vendor-scoring-config'
import { vendorRiskRatingColor, type TVendorRiskRating } from '@/lib/vendor-risk-rating'
import { SCORING_MODE_COPY, SCORING_MODE_ORDER } from '../vendor-scoring-copy'
import { SegmentedBar } from '../segmented-bar'
import { isOneOf } from '@/utils/type-guards'

const isScoringMode = isOneOf(SCORING_MODE_ORDER)

type TVendorScoringScoringPanelProps = {
  draft: TVendorScoringDraft
  readOnly: boolean
  thresholdErrors: Partial<Record<TVendorRiskRating, string>>
  onScoringModeChange: (mode: VendorScoringConfigVendorScoringMode) => void
  onMaxScoreChange: (rating: TVendorRiskRating, maxScore: number | undefined) => void
  onResetMaxScores: (ratings: readonly TVendorRiskRating[]) => void
}

const toBandSegments = (maxScores: TVendorScoringDraft['maxScores']) => {
  const scaleEnd = Math.max(...EDITABLE_RISK_RATINGS.map((rating) => maxScores[rating] ?? 0), 1)
  const bands = EDITABLE_RISK_RATINGS.reduce<{ rating: TVendorRiskRating; from: number; upTo: number }[]>((acc, rating) => {
    const from = acc[acc.length - 1]?.upTo ?? 0
    return [...acc, { rating, from, upTo: Math.max(maxScores[rating] ?? from, from) }]
  }, [])
  return { scaleEnd, segments: bands.map(({ rating, from, upTo }) => ({ key: rating, color: vendorRiskRatingColor(rating), share: (upTo - from) / scaleEnd })) }
}

const RatingBandsBar = ({ maxScores }: { maxScores: TVendorScoringDraft['maxScores'] }) => {
  const { scaleEnd, segments } = toBandSegments(maxScores)

  return (
    <div aria-hidden className="flex flex-col gap-1">
      <SegmentedBar segments={segments} />
      <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
        <span>0</span>
        <span>{scaleEnd}+</span>
      </div>
    </div>
  )
}

const parseMaxScore = (value: string): number | undefined => {
  if (value.trim() === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export const VendorScoringScoringPanel: React.FC<TVendorScoringScoringPanelProps> = ({ draft, readOnly, thresholdErrors, onScoringModeChange, onMaxScoreChange, onResetMaxScores }) => {
  const changedRatings = EDITABLE_RISK_RATINGS.filter((rating) => draft.maxScores[rating] !== getDefaultMaxScore(rating))

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3" aria-labelledby="vendor-scoring-mode-title">
        <div>
          <h3 id="vendor-scoring-mode-title" className="text-sm font-medium">
            How unanswered questions count
          </h3>
          <p className="text-sm text-muted-foreground">Each answered question scores impact × likelihood. A vendor&apos;s score is the total.</p>
        </div>
        <RadioGroup
          value={draft.scoringMode}
          onValueChange={(value) => isScoringMode(value) && onScoringModeChange(value)}
          disabled={readOnly}
          aria-labelledby="vendor-scoring-mode-title"
          className="gap-2"
        >
          {SCORING_MODE_ORDER.map((mode) => (
            <label
              key={mode}
              className={cn('flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-[button:disabled]:cursor-default', draft.scoringMode === mode && 'border-primary bg-primary/5')}
            >
              <RadioGroupItem value={mode} className="mt-0.5" />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="flex items-center gap-2 text-sm font-medium">
                  {SCORING_MODE_COPY[mode].label}
                  {mode === DEFAULT_VENDOR_SCORING_MODE && <Badge variant="outline">Default</Badge>}
                </span>
                <span className="text-sm text-muted-foreground">{SCORING_MODE_COPY[mode].description}</span>
              </span>
            </label>
          ))}
        </RadioGroup>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="vendor-rating-bands-title">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id="vendor-rating-bands-title" className="text-sm font-medium">
              Rating bands
            </h3>
            <p className="text-sm text-muted-foreground">A vendor gets the first rating whose upper score it doesn&apos;t exceed.</p>
          </div>
          {!readOnly && changedRatings.length > 0 && (
            <Button type="button" variant="link" className="shrink-0 text-blue-500" onClick={() => onResetMaxScores(EDITABLE_RISK_RATINGS)}>
              Reset all to default
            </Button>
          )}
        </div>

        {draft.scoringMode === VendorScoringConfigVendorScoringMode.MANUAL && (
          <Callout variant="plain">Bands are not applied while ratings are set by hand. They take effect again if you switch back to automatic scoring.</Callout>
        )}

        <RatingBandsBar maxScores={draft.maxScores} />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Rating</TableHead>
              <TableHead scope="col">Score up to</TableHead>
              <TableHead scope="col">Default</TableHead>
              <TableHead scope="col">
                <span className="sr-only">Reset</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {EDITABLE_RISK_RATINGS.map((rating) => {
              const value = draft.maxScores[rating]
              const defaultValue = getDefaultMaxScore(rating)
              const error = thresholdErrors[rating]
              const label = getEnumLabel(rating)
              const errorId = `vendor-rating-band-${rating}-error`
              return (
                <TableRow key={rating}>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: vendorRiskRatingColor(rating) }} />
                      {label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="any"
                      value={value ?? ''}
                      disabled={readOnly}
                      aria-label={`${label} score up to`}
                      aria-invalid={!!error}
                      aria-describedby={error ? errorId : undefined}
                      onChange={(event) => onMaxScoreChange(rating, parseMaxScore(event.target.value))}
                      className={cn('w-24', error && 'border-destructive')}
                    />
                    {error && (
                      <p id={errorId} className="mt-1 text-xs text-destructive">
                        {error}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{defaultValue}</TableCell>
                  <TableCell className="text-right">
                    {!readOnly && value !== defaultValue && (
                      <Button type="button" variant="link" className="text-xs text-blue-500" onClick={() => onResetMaxScores([rating])}>
                        Reset
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        <p className="text-xs text-muted-foreground">Scores above the Critical band are rated Critical. A score of 0 is rated None.</p>
      </section>
    </div>
  )
}
