import React from 'react'
import { HelpCircle } from 'lucide-react'
import { Label } from '@repo/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { type OnboardingQuestion } from '@/lib/onboarding-questions/types'

export const HelpTooltip: React.FC<{ text: string }> = ({ text }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle size={12} className="shrink-0 cursor-help text-muted-foreground" />
      </TooltipTrigger>
      <TooltipContent className="max-w-[23rem]">
        <p className="font-normal whitespace-pre-line">{text}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)

export const QuestionLabel: React.FC<{ question: OnboardingQuestion; htmlFor?: string }> = ({ question, htmlFor }) => {
  if (!question.label) return null

  return (
    <Label htmlFor={htmlFor} className="font-semibold text-sm">
      <span className="inline-flex items-center gap-1.5">
        {question.label}
        {question.required && <span className="text-red-500">*</span>}
        {question.helpText && <HelpTooltip text={question.helpText} />}
      </span>
    </Label>
  )
}

export const FieldError: React.FC<{ message?: unknown }> = ({ message }) => (typeof message === 'string' ? <p className="text-red-500 text-sm">{message}</p> : null)

export const QuestionDescription: React.FC<{ text?: string; className?: string }> = ({ text, className = 'text-sm' }) =>
  text ? <p className={`${className} text-muted-foreground whitespace-pre-line`}>{text}</p> : null
