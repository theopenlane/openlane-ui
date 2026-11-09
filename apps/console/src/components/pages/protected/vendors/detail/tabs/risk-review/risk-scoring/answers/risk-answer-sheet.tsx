'use client'

import React, { useId, useMemo, useState } from 'react'
import { ChevronRight, Circle, CircleCheck, CircleDot, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { cn } from '@repo/ui/lib/utils'
import { type VendorRiskScoreVendorScoringCategory } from '@repo/codegen/src/schema'
import { LinearBar } from '@/components/shared/linear-bar/linear-bar'
import { SeverityChip } from '@/components/shared/severity/severity-chip'
import EmptyTabState from '@/components/shared/crud-base/tabs/empty-tab-state'
import { useVendorRiskScoreHistories } from '@/lib/graphql-hooks/vendor-risk-score'
import { vendorRiskRatingLevel, type TVendorRiskRating } from '@/lib/vendor-risk-rating'
import { pluralizeWithCount } from '@/utils/strings'
import { formatScoreValue } from '../risk-scoring-utils'
import { buildEarlierAnswers, groupRiskQuestions, hasAnswer, type TRiskQuestion, type TRiskQuestionCategory } from './risk-answers'
import { RiskAnswerCard } from './risk-answer-card'
import { useRiskAnswerSaver } from './use-risk-answer-saver'

type TRiskAnswerSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendorId: string
  vendorName: string
  items: readonly TRiskQuestion[]
  scoreSoFar: number
  rating: TVendorRiskRating | undefined
  hiddenAnswerCount: number
  readOnly: boolean
}

const CategoryProgressIcon = ({ group }: { group: TRiskQuestionCategory }) => {
  if (group.answeredCount === group.questions.length) return <CircleCheck size={14} className="shrink-0 text-success" aria-hidden />
  if (group.answeredCount > 0) return <CircleDot size={14} className="shrink-0 text-primary" aria-hidden />
  return <Circle size={14} className="shrink-0 text-muted-foreground" aria-hidden />
}

export const RiskAnswerSheet: React.FC<TRiskAnswerSheetProps> = ({ open, onOpenChange, vendorId, vendorName, items, scoreSoFar, rating, hiddenAnswerCount, readOnly }) => {
  const queryClient = useQueryClient()
  const [selectedCategory, setSelectedCategory] = useState<VendorRiskScoreVendorScoringCategory | null>(null)
  const [unansweredSnapshot, setUnansweredSnapshot] = useState<ReadonlySet<string> | null>(null)
  const descriptionId = useId()
  const categoryTitleId = useId()

  const groups = useMemo(() => groupRiskQuestions(items), [items])
  const activeGroup = groups.find((group) => group.category === selectedCategory) ?? groups[0]
  const nextGroup = activeGroup ? groups[groups.indexOf(activeGroup) + 1] : undefined
  const visibleItems = (activeGroup?.questions ?? []).filter((item) => !unansweredSnapshot || unansweredSnapshot.has(item.question.key))

  const snapshotUnanswered = (group: TRiskQuestionCategory | undefined) => new Set((group?.questions ?? []).filter((item) => !hasAnswer(item.score)).map((item) => item.question.key))

  const selectCategory = (group: TRiskQuestionCategory) => {
    setSelectedCategory(group.category)
    if (unansweredSnapshot) setUnansweredSnapshot(snapshotUnanswered(group))
  }
  const answeredCount = groups.reduce((sum, group) => sum + group.answeredCount, 0)

  const scoreIds = useMemo(() => (activeGroup?.questions ?? []).flatMap((item) => (item.score ? [item.score.id] : [])), [activeGroup])
  const { data: histories } = useVendorRiskScoreHistories(vendorId, scoreIds, open)
  const earlierAnswers = useMemo(() => buildEarlierAnswers(activeGroup?.questions ?? [], histories ?? []), [activeGroup, histories])

  const { stage, flushAll, statuses, resetStatuses } = useRiskAnswerSaver(vendorId, items)

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (next) return
    void flushAll().then(() => {
      resetStatuses()
      queryClient.invalidateQueries({ queryKey: ['entities'] })
      queryClient.invalidateQueries({ queryKey: ['vendorRiskScores', 'questionUsage'] })
    })
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        initialWidth={1100}
        minWidth={640}
        aria-describedby={descriptionId}
        header={
          <div className="flex flex-col gap-3 pr-1">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <SheetTitle className="truncate text-lg font-normal">Risk questions · {vendorName}</SheetTitle>
                <SheetDescription id={descriptionId}>Each answer saves as soon as you make it.</SheetDescription>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-muted-foreground">Score so far</p>
                <p className="flex items-center justify-end gap-2">
                  <span className="text-lg font-semibold tabular-nums">{formatScoreValue(scoreSoFar)}</span>
                  {rating && <SeverityChip severity={rating} level={vendorRiskRatingLevel(rating)} />}
                </p>
              </div>
              <Button type="button" variant="secondary" size="icon-sm" icon={<X size={16} />} descriptiveTooltipText="Close" onClick={() => handleOpenChange(false)} />
            </div>
            <div className="flex items-center gap-3">
              <LinearBar value={items.length > 0 ? answeredCount / items.length : 0} label="Questions answered" />
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {answeredCount} of {items.length} answered
              </span>
            </div>
            {hiddenAnswerCount > 0 && (
              <p className="text-xs text-warning">
                {pluralizeWithCount(hiddenAnswerCount, 'other answer')} still {hiddenAnswerCount === 1 ? 'counts' : 'count'} toward the score: {hiddenAnswerCount === 1 ? 'it belongs' : 'they belong'}{' '}
                to questions that are turned off or answered twice.
              </p>
            )}
          </div>
        }
        footer={
          <>
            <p className="mr-auto hidden text-xs text-muted-foreground sm:block">Yes means the control is in place and adds nothing. No asks for likelihood and impact.</p>
            {nextGroup && (
              <Button type="button" variant="secondary" onClick={() => selectCategory(nextGroup)}>
                Next category
                <ChevronRight size={16} aria-hidden />
              </Button>
            )}
            <Button type="button" onClick={() => handleOpenChange(false)}>
              Done
            </Button>
          </>
        }
      >
        {groups.length === 0 ? (
          <EmptyTabState title="No questions to answer" description="Every scoring question is turned off. Turn some on in Configure risk scoring." />
        ) : (
          <div className="grid min-h-full grid-cols-1 gap-4 md:grid-cols-[minmax(12rem,16rem)_minmax(0,1fr)]">
            <nav aria-label="Question categories" className="flex flex-col gap-1 border-b pb-3 md:border-r md:border-b-0 md:pr-3">
              {groups.map((group) => (
                <Button
                  key={group.category}
                  type="button"
                  variant="transparent"
                  aria-current={group === activeGroup ? 'true' : undefined}
                  className={cn('h-auto w-full justify-between px-2 py-1.5 hover:border-transparent', group === activeGroup && 'bg-muted')}
                  onClick={() => selectCategory(group)}
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <CategoryProgressIcon group={group} />
                      <span className={cn('truncate text-sm', group === activeGroup && 'font-medium')}>{group.label}</span>
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {group.answeredCount}/{group.questions.length}
                    </span>
                  </span>
                </Button>
              ))}
              <label className="mt-3 flex cursor-pointer items-center gap-2 border-t px-2 pt-3 text-sm">
                <Checkbox checked={!!unansweredSnapshot} onCheckedChange={(checked) => setUnansweredSnapshot(checked === true ? snapshotUnanswered(activeGroup) : null)} />
                Only show unanswered
              </label>
            </nav>

            {activeGroup && (
              <section aria-labelledby={categoryTitleId} className="flex min-w-0 flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 id={categoryTitleId} className="text-base font-medium">
                    {activeGroup.label}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {activeGroup.answeredCount} of {activeGroup.questions.length} answered
                  </span>
                </div>
                {visibleItems.length === 0 ? (
                  <EmptyTabState description="Every question in this category is answered." />
                ) : (
                  visibleItems.map((item) => (
                    <RiskAnswerCard
                      key={item.question.key}
                      item={item}
                      readOnly={readOnly}
                      earlierAnswer={earlierAnswers.get(item.question.key)}
                      status={statuses[item.question.key] ?? 'idle'}
                      stage={stage}
                    />
                  ))
                )}
              </section>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
