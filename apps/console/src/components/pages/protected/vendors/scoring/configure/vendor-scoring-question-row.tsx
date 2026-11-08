'use client'

import React from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Switch } from '@repo/ui/switch'
import { Badge } from '@repo/ui/badge'
import { cn } from '@repo/ui/lib/utils'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { useVendorRiskScoreQuestionUsage } from '@/lib/graphql-hooks/vendor-risk-score'
import { questionOrigin, type TDraftQuestion } from '@/lib/vendor-scoring-config'
import { vendorRiskImpactLevel } from '@/lib/vendor-risk-rating'
import { SeverityChip } from '@/components/shared/severity/severity-chip'
import { pluralizeWithCount } from '@/utils/strings'
import { ANSWER_TYPE_COPY } from '../vendor-scoring-copy'

type TVendorScoringQuestionRowProps = {
  question: TDraftQuestion
  readOnly: boolean
  onToggle: (enabled: boolean) => void
  onEdit: () => void
  onReset: () => void
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

export const VendorScoringQuestionRow: React.FC<TVendorScoringQuestionRowProps> = ({ question, readOnly, onToggle, onEdit, onReset, onRemove }) => {
  const origin = questionOrigin(question)

  return (
    <li className={cn('flex items-start gap-3 px-3 py-3', !question.enabled && 'opacity-60')}>
      <Switch checked={question.enabled} onCheckedChange={onToggle} disabled={readOnly} aria-label={`Include "${question.name}"`} className="mt-0.5 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm">{question.name}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {question.key ? <span className="font-mono">{question.key}</span> : <span>Key assigned on save</span>}
          <span>{ANSWER_TYPE_COPY[question.answerType].label}</span>
          <span className="flex items-center gap-1">
            Impact <SeverityChip severity={question.suggestedImpact} level={vendorRiskImpactLevel(question.suggestedImpact)} />
          </span>
          {origin === 'custom' && <Badge variant="purple">Custom</Badge>}
          {origin === 'edited' && <Badge variant="blue">Edited</Badge>}
          {origin === 'edited' && !readOnly && (
            <Button type="button" variant="link" className="h-auto text-xs text-blue-500" onClick={onReset}>
              Reset to default
            </Button>
          )}
        </div>
      </div>
      {!readOnly && (
        <div className="flex shrink-0 items-center gap-1">
          <Button type="button" variant="transparent" size="icon-sm" icon={<Pencil size={16} />} descriptiveTooltipText="Edit question" onClick={onEdit} />
          {origin === 'custom' && <QuestionRemoveButton questionKey={question.key} onRemove={onRemove} />}
        </div>
      )}
    </li>
  )
}
