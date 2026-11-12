'use client'

import React, { useId, useMemo, useRef, useState } from 'react'
import { ChevronRight, Circle, CircleAlert, CircleCheck, CircleDot, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { cn } from '@repo/ui/lib/utils'
import { type VendorRiskScoreVendorScoringCategory } from '@repo/codegen/src/schema'
import { VendorLogo } from '@/components/shared/vendor-logo/vendor-logo'
import { LinearBar } from '@/components/shared/linear-bar/linear-bar'
import { SeverityChip } from '@/components/shared/severity/severity-chip'
import EmptyTabState from '@/components/shared/crud-base/tabs/empty-tab-state'
import { useVendorRiskScoreHistories } from '@/lib/graphql-hooks/vendor-risk-score'
import { vendorRiskRatingLevel } from '@/lib/vendor-risk-rating'
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
  vendorLogoUrl?: string
  items: readonly TRiskQuestion[]
  riskScore: number | null | undefined
  riskRating: string | null | undefined
  hiddenAnswerCount: number
  readOnly: boolean
}

type TClosePrompt = 'incomplete' | 'failed'

const closePromptCopy = (prompt: TClosePrompt, incompleteCount: number) => {
  if (prompt === 'failed') {
    return {
      title: 'Some answers could not be saved',
      description: 'Closing now discards the answers that failed to save. Keep editing, then select Done to try saving them again.',
      confirmationText: 'Close anyway',
    }
  }
  const one = incompleteCount === 1
  return {
    title: 'You have unfinished answers',
    description: `${pluralizeWithCount(incompleteCount, 'answer')} still ${one ? 'needs' : 'need'} a likelihood, a valid value or an answer before ${one ? 'it' : 'they'} can be saved.`,
    confirmationText: 'Discard and close',
  }
}

const CategoryProgressIcon = ({ group }: { group: TRiskQuestionCategory }) => {
  if (group.answeredCount === group.questions.length) return <CircleCheck size={14} className="shrink-0 text-success" aria-hidden />
  if (group.answeredCount > 0) return <CircleDot size={14} className="shrink-0 text-primary" aria-hidden />
  return <Circle size={14} className="shrink-0 text-muted-foreground" aria-hidden />
}

export const RiskAnswerSheet: React.FC<TRiskAnswerSheetProps> = ({ open, onOpenChange, vendorId, vendorName, vendorLogoUrl, items, riskScore, riskRating, hiddenAnswerCount, readOnly }) => {
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

  const { stage, flushAll, statuses, drafts, incompleteKeys, discardDrafts, aggregate, reset } = useRiskAnswerSaver(vendorId, items)
  const closingRef = useRef(false)
  const savedAnyRef = useRef(false)
  const [isClosing, setIsClosing] = useState(false)
  const [isPromptOpen, setIsPromptOpen] = useState(false)
  const [closePrompt, setClosePrompt] = useState<{ kind: TClosePrompt; incompleteCount: number }>({ kind: 'incomplete', incompleteCount: 0 })

  const openPrompt = (kind: TClosePrompt) => {
    setClosePrompt({ kind, incompleteCount: incompleteKeys.length })
    setIsPromptOpen(true)
  }

  const finishClose = () => {
    onOpenChange(false)
    setIsPromptOpen(false)
    reset()
    if (!savedAnyRef.current) return
    savedAnyRef.current = false
    queryClient.invalidateQueries({ queryKey: ['entities'] })
    queryClient.invalidateQueries({ queryKey: ['vendorRiskScores', 'questionUsage'] })
  }

  const saveAndClose = async () => {
    if (closingRef.current) return
    closingRef.current = true
    setIsClosing(true)
    try {
      const { failedKeys, savedAny } = await flushAll()
      savedAnyRef.current = savedAny
      if (failedKeys.length > 0) openPrompt('failed')
      else finishClose()
    } finally {
      closingRef.current = false
      setIsClosing(false)
    }
  }

  const requestClose = () => {
    if (closingRef.current) return
    if (incompleteKeys.length > 0) openPrompt('incomplete')
    else void saveAndClose()
  }

  const confirmClosePrompt = () => {
    if (closePrompt.kind === 'incomplete') {
      discardDrafts(incompleteKeys)
      void saveAndClose()
    } else finishClose()
  }

  const shown = aggregate ?? { riskScore, riskRating }

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? onOpenChange(true) : requestClose())}>
      <SheetContent
        initialWidth={1100}
        minWidth={640}
        aria-describedby={descriptionId}
        header={
          <div className="flex flex-col gap-3 pr-1">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <VendorLogo name={vendorName} logoUrl={vendorLogoUrl} />
                <div className="min-w-0">
                  <SheetTitle className="truncate text-lg font-normal">{vendorName}</SheetTitle>
                  <SheetDescription id={descriptionId}>Review and answer risk assessment questions for this vendor</SheetDescription>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-muted-foreground">Risk score</p>
                <p className="flex items-center justify-end gap-2">
                  {shown.riskScore == null ? (
                    <span className="text-sm text-muted-foreground">Not scored</span>
                  ) : (
                    <span className="text-lg font-semibold tabular-nums">{formatScoreValue(shown.riskScore)}</span>
                  )}
                  {shown.riskRating && <SeverityChip severity={shown.riskRating} level={vendorRiskRatingLevel(shown.riskRating)} />}
                </p>
              </div>
              <Button type="button" variant="secondary" size="icon-sm" icon={<X size={16} />} descriptiveTooltipText="Close" onClick={requestClose} disabled={isClosing} />
            </div>
            <div className="flex items-center gap-3">
              <LinearBar value={items.length > 0 ? answeredCount / items.length : 0} label="Questions answered" />
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {answeredCount} of {items.length} answered
              </span>
            </div>
            {hiddenAnswerCount > 0 && (
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <CircleAlert size={14} className="mt-0.5 shrink-0 text-warning" aria-hidden />
                <span>
                  {pluralizeWithCount(hiddenAnswerCount, 'other answer')} still {hiddenAnswerCount === 1 ? 'counts' : 'count'} toward the score:{' '}
                  {hiddenAnswerCount === 1 ? 'it belongs' : 'they belong'} to questions that are turned off or answered twice.
                </span>
              </p>
            )}
          </div>
        }
        footer={
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {nextGroup && (
              <Button type="button" variant="secondary" onClick={() => selectCategory(nextGroup)}>
                Next category
                <ChevronRight size={16} aria-hidden />
              </Button>
            )}
            <Button type="button" onClick={requestClose} loading={isClosing} disabled={isClosing}>
              Done
            </Button>
          </div>
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
                      draft={drafts[item.question.key]}
                      readOnly={readOnly || isClosing}
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
      <ConfirmationDialog
        open={isPromptOpen}
        onOpenChange={setIsPromptOpen}
        onConfirm={confirmClosePrompt}
        {...closePromptCopy(closePrompt.kind, closePrompt.incompleteCount)}
        cancellationText="Keep editing"
      />
    </Sheet>
  )
}
