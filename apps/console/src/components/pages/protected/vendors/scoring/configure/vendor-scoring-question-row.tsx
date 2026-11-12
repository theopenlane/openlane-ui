'use client'

import React from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Switch } from '@repo/ui/switch'
import { cn } from '@repo/ui/lib/utils'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { useVendorRiskScoreQuestionUsage } from '@/lib/graphql-hooks/vendor-risk-score'
import { questionOrigin, type TDraftQuestion } from '@/lib/vendor-scoring-config'
import { pluralizeWithCount } from '@/utils/strings'
import { ANSWER_TYPE_COPY } from '../vendor-scoring-copy'
import { ImpactChip } from '../impact-chip'
import { QuestionOriginBadge } from '../question-origin-badge'

type TVendorScoringQuestionRowProps = {
  question: TDraftQuestion
  readOnly: boolean
  onToggle: (enabled: boolean) => void
  onEdit: () => void
  onRemove: () => void
}

const QuestionRemoveButton = ({ questionKey, onRemove }: { questionKey: string; onRemove: () => void }) => {
  const { answerCount, isPending, isError } = useVendorRiskScoreQuestionUsage(questionKey || undefined)
  const disabledReason = !questionKey
    ? undefined
    : isPending
      ? 'Checking whether vendors have answered this question…'
      : isError
        ? 'Could not check whether vendors have answered this question. Turn it off instead.'
        : answerCount
          ? `Already used in ${pluralizeWithCount(answerCount, 'vendor score', 'vendor scores')}. Turn it off instead so they stay readable.`
          : undefined

  return (
    <DisabledReasonTooltip reason={disabledReason}>
      <Button type="button" variant="transparent" size="icon-sm" icon={<Trash2 size={16} />} descriptiveTooltipText="Delete question" disabled={!!disabledReason} onClick={onRemove} />
    </DisabledReasonTooltip>
  )
}

export const VendorScoringQuestionRow: React.FC<TVendorScoringQuestionRowProps> = ({ question, readOnly, onToggle, onEdit, onRemove }) => {
  const origin = questionOrigin(question)

  return (
    <li className={cn('flex items-center gap-3 px-3 py-3', !question.enabled && 'opacity-60')}>
      <Switch checked={question.enabled} onCheckedChange={onToggle} disabled={readOnly} aria-label={`Include "${question.name}"`} className="shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="text-sm">{question.name}</p>
        <div className="flex flex-wrap items-center gap-2">
          <ImpactChip impact={question.suggestedImpact} />
          {origin !== 'default' && <QuestionOriginBadge origin={origin} />}
        </div>
      </div>
      <span className="w-20 shrink-0 text-sm text-muted-foreground">{ANSWER_TYPE_COPY[question.answerType].label}</span>
      {!readOnly && (
        <div className="flex shrink-0 items-center gap-1">
          <Button type="button" variant="transparent" size="icon-sm" icon={<Pencil size={16} />} descriptiveTooltipText="Edit question" onClick={onEdit} />
          {origin === 'custom' && <QuestionRemoveButton questionKey={question.key} onRemove={onRemove} />}
        </div>
      )}
    </li>
  )
}
