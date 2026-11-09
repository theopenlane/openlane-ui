'use client'

import React, { useId, useState } from 'react'
import { CircleCheck, Circle, History } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@repo/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { cn } from '@repo/ui/lib/utils'
import { VendorRiskScoreVendorScoringAnswerType, type UpdateVendorRiskScoreInput, type VendorRiskScoreVendorRiskLikelihood } from '@repo/codegen/src/schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { isOneOf } from '@/utils/type-guards'
import { type TVendorScoringQuestionDef } from '@/lib/vendor-scoring-config'
import { formatScoreValue } from '../risk-scoring-utils'
import { BOOLEAN_ANSWER, hasAnswer, IMPACT_ORDER, isBooleanQuestion, isNoAnswer, isYesAnswer, LIKELIHOOD_ORDER, NO_RISK_LIKELIHOOD, toUpdateRiskScoreInput, type TRiskQuestion } from './risk-answers'
import { type TAnswerDraft, type TSaveStatus, type useRiskAnswerSaver } from './use-risk-answer-saver'

type TDraft = TAnswerDraft

const isLikelihood = isOneOf(LIKELIHOOD_ORDER)
const isImpact = isOneOf(IMPACT_ORDER)

const draftFromItem = ({ question, score }: TRiskQuestion): TDraft => ({
  answer: score?.answer ?? '',
  likelihood: hasAnswer(score) && !isYesAnswer(score ?? question, score?.answer) ? score?.likelihood : undefined,
  impact: score?.impact ?? question.suggestedImpact,
  notes: score?.notes ?? '',
})

const STATUS_LABEL: Record<TSaveStatus, string | undefined> = { idle: undefined, pending: 'Saving…', success: 'Saved', error: 'Could not save' }

const STATUS_CLASS: Record<TSaveStatus, string> = { idle: '', pending: 'text-muted-foreground', success: 'text-success', error: 'text-destructive' }

type TBooleanButtonsProps = { yesPressed?: boolean; noPressed?: boolean; disabled: boolean; onYes: () => void; onNo: () => void }

const BooleanAnswerButtons = ({ yesPressed, noPressed, disabled, onYes, onNo }: TBooleanButtonsProps) => (
  <div className="flex shrink-0 gap-1">
    <Button type="button" variant="secondary" className={cn(yesPressed && 'border-success text-success')} aria-pressed={yesPressed} onClick={onYes} disabled={disabled}>
      Yes
    </Button>
    <Button type="button" variant="secondary" className={cn(noPressed && 'border-warning text-warning')} aria-pressed={noPressed} onClick={onNo} disabled={disabled}>
      No
    </Button>
  </div>
)

type TAnswerInputProps = { question: TVendorScoringQuestionDef; value: string; disabled: boolean; labelledBy: string; onChange: (value: string) => void; onSelect: (value: string) => void }

const AnswerInput = ({ question, value, disabled, labelledBy, onChange, onSelect }: TAnswerInputProps) => {
  if (question.answerType === VendorRiskScoreVendorScoringAnswerType.SINGLE_SELECT) {
    return (
      <Select value={value || undefined} onValueChange={onSelect} disabled={disabled}>
        <SelectTrigger className="w-60" aria-labelledby={labelledBy}>
          <SelectValue placeholder="Choose an answer" />
        </SelectTrigger>
        <SelectContent>
          {(question.answerOptions ?? []).map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <Input
      aria-labelledby={labelledBy}
      className="w-60"
      type={question.answerType === VendorRiskScoreVendorScoringAnswerType.NUMERIC ? 'number' : 'text'}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

type TRiskAnswerCardProps = {
  item: TRiskQuestion
  readOnly: boolean
  earlierAnswer?: string
  status: TSaveStatus
  stage: ReturnType<typeof useRiskAnswerSaver>['stage']
}

export const RiskAnswerCard: React.FC<TRiskAnswerCardProps> = ({ item, readOnly, earlierAnswer, status, stage }) => {
  const { question, score } = item
  const answerTypeOf = score ?? question
  const [draft, setDraft] = useState<TDraft>(() => draftFromItem(item))
  const [expanded, setExpanded] = useState(() => hasAnswer(score) && !isYesAnswer(answerTypeOf, score?.answer))
  const headingId = useId()

  const isBoolean = isBooleanQuestion(question)
  const isSavedYes = isYesAnswer(answerTypeOf, score?.answer)
  const answered = hasAnswer(score)
  const draftIsYes = isYesAnswer(answerTypeOf, draft.answer)
  const draftIsNo = isNoAnswer(answerTypeOf, draft.answer)
  const pendingLikelihood = !!draft.answer.trim() && !draftIsYes && !draft.likelihood

  const update = (patch: Partial<TDraft>, input: UpdateVendorRiskScoreInput, options?: Parameters<typeof stage>[3]) => {
    const next = { ...draft, ...patch }
    setDraft(next)
    if (!readOnly) void stage(item, next, input, options)
  }

  const answerYes = () => {
    setExpanded(false)
    update({ answer: BOOLEAN_ANSWER.YES }, toUpdateRiskScoreInput({ answer: BOOLEAN_ANSWER.YES, likelihood: draftIsNo && draft.likelihood ? draft.likelihood : NO_RISK_LIKELIHOOD }))
  }

  const answerNo = () => {
    setExpanded(true)
    const likelihood = draftIsNo ? draft.likelihood : undefined
    update({ answer: BOOLEAN_ANSWER.NO, likelihood }, likelihood ? toUpdateRiskScoreInput({ answer: BOOLEAN_ANSWER.NO, likelihood }) : {}, { drop: ['answer', 'likelihood'] })
  }

  const clear = () => {
    setExpanded(false)
    update({ answer: '', likelihood: undefined }, { clearAnswer: true }, { drop: ['answer', 'likelihood'] })
  }

  const changeAnswer = (value: string, { immediate }: { immediate: boolean }) => {
    const answer = value.trim()
    const isValid = !!answer && (question.answerType !== VendorRiskScoreVendorScoringAnswerType.NUMERIC || Number.isFinite(Number(answer)))
    if (!isValid) {
      update({ answer: value }, {}, { debounce: true, drop: ['answer'] })
      return
    }
    update({ answer: value }, draft.likelihood ? toUpdateRiskScoreInput({ answer }) : {}, { debounce: !immediate })
  }

  const chooseLikelihood = (likelihood: VendorRiskScoreVendorRiskLikelihood) =>
    update({ likelihood }, toUpdateRiskScoreInput({ likelihood, ...(draft.answer.trim() !== (score?.answer ?? '') ? { answer: draft.answer.trim() } : {}) }))

  if (!expanded) {
    return (
      <article aria-labelledby={headingId} className={cn('flex items-center gap-3 rounded-lg border px-3 py-2.5', !answered && 'border-dashed')}>
        {isSavedYes ? <CircleCheck size={18} className="shrink-0 text-success" aria-hidden /> : <Circle size={18} className="shrink-0 text-muted-foreground" aria-hidden />}
        <div className="min-w-0 flex-1">
          <p id={headingId} className="text-sm">
            {question.name}
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-mono">{question.key}</span> · {isSavedYes ? 'Yes · adds 0' : `${getEnumLabel(draft.impact)} impact`}
          </p>
        </div>
        {!readOnly && (
          <div role="group" aria-labelledby={headingId}>
            {isSavedYes || !isBoolean ? (
              <Button type="button" variant="secondary" onClick={() => setExpanded(true)}>
                {isSavedYes ? 'Change' : 'Answer'}
              </Button>
            ) : (
              <BooleanAnswerButtons disabled={false} onYes={answerYes} onNo={answerNo} />
            )}
          </div>
        )}
      </article>
    )
  }

  const statusLabel = pendingLikelihood ? 'Pick a likelihood to save' : STATUS_LABEL[status]
  const answerLabelId = `${headingId}-answer`
  const likelihoodLabelId = `${headingId}-likelihood`
  const impactLabelId = `${headingId}-impact`
  const notesLabelId = `${headingId}-notes`

  return (
    <article aria-labelledby={headingId} className={cn('flex flex-col gap-3 rounded-lg border p-3', answered && !isSavedYes ? 'border-warning/60' : 'border-primary/60')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p id={headingId} className="text-sm font-medium">
            {question.name}
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-mono">{question.key}</span> · {getEnumLabel(question.category)}
          </p>
          {question.description && <p className="mt-1 text-xs text-muted-foreground">{question.description}</p>}
        </div>
        {answered && !isSavedYes && score && (
          <div className="shrink-0 text-right">
            <p className="text-xs text-muted-foreground">Adds</p>
            <p className="text-lg font-semibold text-warning tabular-nums">{formatScoreValue(score.score)}</p>
          </div>
        )}
      </div>

      <div role="group" aria-labelledby={headingId} className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2 text-sm">
        <span id={answerLabelId} className="text-muted-foreground">
          Answer
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {isBoolean ? (
            <BooleanAnswerButtons yesPressed={draftIsYes} noPressed={draftIsNo} disabled={readOnly} onYes={answerYes} onNo={answerNo} />
          ) : (
            <AnswerInput
              question={question}
              value={draft.answer}
              disabled={readOnly}
              labelledBy={`${headingId} ${answerLabelId}`}
              onChange={(value) => changeAnswer(value, { immediate: false })}
              onSelect={(value) => changeAnswer(value, { immediate: true })}
            />
          )}
          {!readOnly && (answered || !!draft.answer) && (
            <Button type="button" variant="link" className="text-blue-500" onClick={clear}>
              Clear
            </Button>
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
              <span className="text-xs text-muted-foreground">Suggested: {getEnumLabel(question.suggestedImpact)}. Change it if this vendor&apos;s exposure differs.</span>
            </div>

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
          </>
        )}
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
        <span className={cn('shrink-0', pendingLikelihood ? 'text-warning' : STATUS_CLASS[status])} role="status">
          {statusLabel}
        </span>
      </div>
    </article>
  )
}
