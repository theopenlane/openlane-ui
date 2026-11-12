'use client'

import React, { memo, useId, useState } from 'react'
import { ChevronDown, ChevronUp, CircleCheck, Circle, History, Info, X } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Textarea } from '@repo/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@repo/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { AnswerInput, BooleanAnswerButtons, SaveStatusText } from './risk-answer-controls'
import { cn } from '@repo/ui/lib/utils'
import { type UpdateVendorRiskScoreInput, type VendorRiskScoreVendorRiskLikelihood } from '@repo/codegen/src/schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { isOneOf } from '@/utils/type-guards'
import { ImpactChip } from '@/components/pages/protected/vendors/scoring/impact-chip'
import { formatScoreValue } from '../risk-scoring-utils'
import {
  BOOLEAN_ANSWER,
  hasAnswer,
  IMPACT_ORDER,
  incompleteDraftReason,
  isBooleanQuestion,
  isNoAnswer,
  isValidAnswer,
  isYesAnswer,
  LIKELIHOOD_ORDER,
  NO_RISK_LIKELIHOOD,
  toUpdateRiskScoreInput,
  type TAnswerDraft,
  type TRiskQuestion,
} from './risk-answers'
import { type TSaveStatus, type useRiskAnswerSaver } from './use-risk-answer-saver'

const isLikelihood = isOneOf(LIKELIHOOD_ORDER)
const isImpact = isOneOf(IMPACT_ORDER)

const BOOLEAN_HINT = 'Yes means the control is in place and adds no risk. No asks you to assess likelihood and impact.'

const draftFromItem = ({ question, score }: TRiskQuestion): TAnswerDraft => ({
  answer: score?.answer ?? '',
  likelihood: hasAnswer(score) && !isYesAnswer(score ?? question, score?.answer) ? score?.likelihood : undefined,
  impact: score?.impact ?? question.suggestedImpact,
  notes: score?.notes ?? '',
})

type TRiskAnswerCardProps = {
  item: TRiskQuestion
  draft: TAnswerDraft | undefined
  readOnly: boolean
  earlierAnswer?: string
  status: TSaveStatus
  stage: ReturnType<typeof useRiskAnswerSaver>['stage']
}

const RiskAnswerCardComponent: React.FC<TRiskAnswerCardProps> = ({ item, draft: stagedDraft, readOnly, earlierAnswer, status, stage }) => {
  const { question, score } = item
  const answerTypeOf = score ?? question
  const draft = stagedDraft ?? draftFromItem(item)
  const [expanded, setExpanded] = useState(() => !!incompleteDraftReason(item, draft) || (hasAnswer(score) && !isYesAnswer(answerTypeOf, score?.answer)))
  const [showWhy, setShowWhy] = useState(false)
  const headingId = useId()
  const whyId = useId()

  const isBoolean = isBooleanQuestion(question)
  const isSavedYes = isYesAnswer(answerTypeOf, score?.answer)
  const answered = hasAnswer(score)
  const draftIsYes = isYesAnswer(answerTypeOf, draft.answer)
  const draftIsNo = isNoAnswer(answerTypeOf, draft.answer)
  const incompleteReason = readOnly ? undefined : incompleteDraftReason(item, draft)

  const update = (patch: Partial<TAnswerDraft>, input: UpdateVendorRiskScoreInput, options?: Parameters<typeof stage>[3]) => {
    if (!readOnly) void stage(item, { ...draft, ...patch }, input, options)
  }

  const answerYes = () => update({ answer: BOOLEAN_ANSWER.YES }, toUpdateRiskScoreInput({ answer: BOOLEAN_ANSWER.YES, likelihood: NO_RISK_LIKELIHOOD }))

  const answerNo = () => {
    setExpanded(true)
    const likelihood = draftIsNo ? draft.likelihood : undefined
    update({ answer: BOOLEAN_ANSWER.NO, likelihood }, likelihood ? toUpdateRiskScoreInput({ answer: BOOLEAN_ANSWER.NO, likelihood }) : {}, { drop: ['answer', 'likelihood'] })
  }

  const clear = () => update({ answer: '', likelihood: undefined }, { clearAnswer: true }, { drop: ['answer', 'likelihood'] })

  const changeAnswer = (value: string, { immediate }: { immediate: boolean }) => {
    const answer = value.trim()
    if (!answer) {
      update({ answer: value, likelihood: undefined }, score ? { clearAnswer: true } : {}, { debounce: !immediate, drop: ['answer', 'likelihood'] })
      return
    }
    if (!isValidAnswer(item, answer)) {
      update({ answer: value }, {}, { debounce: true, drop: ['answer'] })
      return
    }
    update({ answer: value }, draft.likelihood ? toUpdateRiskScoreInput({ answer }) : {}, { debounce: !immediate })
  }

  const chooseLikelihood = (likelihood: VendorRiskScoreVendorRiskLikelihood) =>
    update({ likelihood }, toUpdateRiskScoreInput({ likelihood, ...(draft.answer.trim() !== (score?.answer ?? '') ? { answer: draft.answer.trim() } : {}) }))

  const answerLabelId = `${headingId}-answer`
  const likelihoodLabelId = `${headingId}-likelihood`
  const impactLabelId = `${headingId}-impact`
  const notesLabelId = `${headingId}-notes`

  const header = (
    <div className="flex items-start gap-3">
      {status !== 'error' && (isSavedYes || (answered && !incompleteReason)) ? (
        <CircleCheck size={18} className="mt-0.5 shrink-0 text-success" aria-hidden />
      ) : (
        <Circle size={18} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p id={headingId} className="text-sm">
          {question.name}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <ImpactChip impact={draft.impact} />
          {question.description && (
            <Button
              type="button"
              variant="link"
              className="text-xs text-muted-foreground"
              aria-expanded={showWhy}
              aria-controls={whyId}
              icon={showWhy ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              onClick={() => setShowWhy((current) => !current)}
            >
              Why it matters
            </Button>
          )}
        </div>
        {question.description && (
          <p id={whyId} hidden={!showWhy} className="text-xs text-muted-foreground">
            {question.description}
          </p>
        )}
      </div>
      {expanded && answered && !isSavedYes && score && (
        <div className="shrink-0 text-right">
          <p className="text-xs text-muted-foreground">Adds</p>
          <p className="text-lg font-semibold tabular-nums">{formatScoreValue(score.score)}</p>
        </div>
      )}
      <div role="group" aria-labelledby={headingId} className="flex shrink-0 items-center gap-1">
        {!expanded &&
          !readOnly &&
          (isBoolean ? (
            <BooleanAnswerButtons yesPressed={draftIsYes} noPressed={draftIsNo} disabled={false} onYes={answerYes} onNo={answerNo} onClear={clear} />
          ) : (
            <Button type="button" variant="secondary" onClick={() => setExpanded(true)}>
              {answered ? 'Change' : 'Answer'}
            </Button>
          ))}
        <Button
          type="button"
          variant="transparent"
          size="icon-sm"
          icon={expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          descriptiveTooltipText={expanded ? 'Hide details' : 'Show details'}
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        />
      </div>
    </div>
  )

  if (!expanded) {
    return (
      <article aria-labelledby={headingId} className={cn('rounded-lg border px-3 py-2.5', !answered && 'border-dashed')}>
        {header}
      </article>
    )
  }

  return (
    <article aria-labelledby={headingId} className="flex flex-col gap-3 rounded-lg border border-primary/60 p-3">
      {header}

      <div role="group" aria-labelledby={headingId} className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2 border-t pt-3 text-sm">
        <span id={answerLabelId} className="flex items-center gap-1 text-muted-foreground">
          Answer
          {isBoolean && <Button type="button" variant="transparent" size="icon-xs" icon={<Info size={14} />} descriptiveTooltipText={BOOLEAN_HINT} />}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {isBoolean ? (
            <BooleanAnswerButtons yesPressed={draftIsYes} noPressed={draftIsNo} disabled={readOnly} onYes={answerYes} onNo={answerNo} onClear={clear} />
          ) : (
            <>
              <AnswerInput
                question={question}
                value={draft.answer}
                disabled={readOnly}
                labelledBy={`${headingId} ${answerLabelId}`}
                onChange={(value) => changeAnswer(value, { immediate: false })}
                onSelect={(value) => changeAnswer(value, { immediate: true })}
              />
              {!readOnly && (answered || !!draft.answer) && <Button type="button" variant="transparent" size="icon-sm" icon={<X size={16} />} descriptiveTooltipText="Clear answer" onClick={clear} />}
            </>
          )}
        </div>

        {!draftIsYes && (
          <>
            <span id={likelihoodLabelId} className="text-muted-foreground">
              Likelihood
            </span>
            <RadioGroup
              value={draft.likelihood ?? ''}
              onValueChange={(value) => isLikelihood(value) && chooseLikelihood(value)}
              disabled={readOnly}
              aria-labelledby={`${headingId} ${likelihoodLabelId}`}
              className="flex flex-wrap gap-1"
            >
              {LIKELIHOOD_ORDER.map((likelihood) => (
                <label
                  key={likelihood}
                  className="flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 has-[button:disabled]:cursor-default has-[button[data-state=checked]]:border-primary has-[button[data-state=checked]]:bg-primary/10"
                >
                  <RadioGroupItem value={likelihood} />
                  {getEnumLabel(likelihood)}
                </label>
              ))}
            </RadioGroup>

            <span id={impactLabelId} className="text-muted-foreground">
              Impact
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={draft.impact} onValueChange={(value) => isImpact(value) && update({ impact: value }, toUpdateRiskScoreInput({ impact: value }))} disabled={readOnly}>
                <SelectTrigger className="w-36" aria-labelledby={`${headingId} ${impactLabelId}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMPACT_ORDER.map((impact) => (
                    <SelectItem key={impact} value={impact}>
                      {getEnumLabel(impact)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">Default: {getEnumLabel(question.suggestedImpact)}. Change it if this vendor&apos;s exposure differs.</span>
            </div>
          </>
        )}

        <span id={notesLabelId} className="self-start pt-2 text-muted-foreground">
          Notes
        </span>
        <Textarea
          aria-labelledby={`${headingId} ${notesLabelId}`}
          rows={2}
          value={draft.notes}
          disabled={readOnly}
          onChange={(event) => update({ notes: event.target.value }, toUpdateRiskScoreInput({ notes: event.target.value }), { debounce: true })}
        />
      </div>

      <div className="flex items-center justify-between gap-3 border-t pt-2 text-xs">
        <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
          {earlierAnswer && (
            <>
              <History size={14} className="shrink-0" aria-hidden />
              <span className="truncate">Earlier answer: {earlierAnswer}</span>
            </>
          )}
        </span>
        <SaveStatusText status={status} incompleteReason={incompleteReason} />
      </div>
    </article>
  )
}

export const RiskAnswerCard = memo(RiskAnswerCardComponent)
