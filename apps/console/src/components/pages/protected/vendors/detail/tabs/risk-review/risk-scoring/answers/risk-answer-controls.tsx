'use client'

import React from 'react'
import { CircleAlert, CircleCheck, X } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { cn } from '@repo/ui/lib/utils'
import { VendorRiskScoreVendorScoringAnswerType } from '@repo/codegen/src/schema'
import { type TVendorScoringQuestionDef } from '@/lib/vendor-scoring-config'
import { type TSaveStatus } from './use-risk-answer-saver'

const STATUS_LABEL: Record<TSaveStatus, string | undefined> = { idle: undefined, pending: 'Saving…', success: 'Saved', error: 'Could not save' }

const PRESSED_CLASS = 'border-primary bg-primary/10'

type TAnswerButtonProps = { label: string; pressed: boolean; disabled: boolean; onPress: () => void; onClear: () => void }

const AnswerButton = ({ label, pressed, disabled, onPress, onClear }: TAnswerButtonProps) => {
  const clearable = pressed && !disabled
  return (
    <Button
      type="button"
      variant="secondary"
      className={cn(pressed && PRESSED_CLASS)}
      aria-pressed={pressed}
      aria-description={clearable ? 'Press again to clear the answer' : undefined}
      icon={clearable ? <X size={14} /> : undefined}
      onClick={pressed ? onClear : onPress}
      disabled={disabled}
    >
      {label}
    </Button>
  )
}

type TBooleanButtonsProps = { yesPressed: boolean; noPressed: boolean; disabled: boolean; onYes: () => void; onNo: () => void; onClear: () => void }

export const BooleanAnswerButtons = ({ yesPressed, noPressed, disabled, onYes, onNo, onClear }: TBooleanButtonsProps) => (
  <div className="flex shrink-0 gap-1">
    <AnswerButton label="Yes" pressed={yesPressed} disabled={disabled} onPress={onYes} onClear={onClear} />
    <AnswerButton label="No" pressed={noPressed} disabled={disabled} onPress={onNo} onClear={onClear} />
  </div>
)

type TAnswerInputProps = { question: TVendorScoringQuestionDef; value: string; disabled: boolean; labelledBy: string; onChange: (value: string) => void; onSelect: (value: string) => void }

export const AnswerInput = ({ question, value, disabled, labelledBy, onChange, onSelect }: TAnswerInputProps) => {
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
      onChange={(event) => !event.target.validity.badInput && onChange(event.target.value)}
    />
  )
}

export const SaveStatusText = ({ status, incompleteReason }: { status: TSaveStatus; incompleteReason: string | undefined }) => {
  if (incompleteReason) {
    return (
      <span className="flex shrink-0 items-center gap-1 text-muted-foreground" role="status">
        <CircleAlert size={14} className="text-warning" aria-hidden />
        {incompleteReason}
      </span>
    )
  }
  return (
    <span className={cn('flex shrink-0 items-center gap-1', status === 'error' ? 'text-destructive' : 'text-muted-foreground')} role="status">
      {status === 'success' && <CircleCheck size={14} className="text-success" aria-hidden />}
      {STATUS_LABEL[status]}
    </span>
  )
}
