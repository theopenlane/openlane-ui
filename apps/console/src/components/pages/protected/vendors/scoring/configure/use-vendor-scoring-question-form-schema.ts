'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { VendorRiskScoreVendorRiskImpact, VendorRiskScoreVendorScoringAnswerType, VendorRiskScoreVendorScoringCategory } from '@repo/codegen/src/schema'
import { type TVendorScoringQuestionDef } from '@/lib/vendor-scoring-config'
import { type TQuestionDraftValues } from '@/lib/vendor-scoring-config'

const MIN_SELECT_OPTIONS = 2

const toOptionLines = (text: string | undefined) => [...new Set((text ?? '').split('\n').map((line) => line.trim()))].filter(Boolean)

const questionFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Enter the question.'),
    description: z.string().optional(),
    category: z.enum(VendorRiskScoreVendorScoringCategory),
    suggestedImpact: z.enum(VendorRiskScoreVendorRiskImpact),
    answerType: z.enum(VendorRiskScoreVendorScoringAnswerType),
    answerOptionsText: z.string().optional(),
  })
  .refine((values) => values.answerType !== VendorRiskScoreVendorScoringAnswerType.SINGLE_SELECT || toOptionLines(values.answerOptionsText).length >= MIN_SELECT_OPTIONS, {
    path: ['answerOptionsText'],
    error: `Add at least ${MIN_SELECT_OPTIONS} options, one per line.`,
  })

export type TVendorScoringQuestionFormData = z.infer<typeof questionFormSchema>

export const NEW_QUESTION_DEFAULTS: TVendorScoringQuestionFormData = {
  name: '',
  description: '',
  category: VendorRiskScoreVendorScoringCategory.SECURITY_PRACTICES,
  suggestedImpact: VendorRiskScoreVendorRiskImpact.MEDIUM,
  answerType: VendorRiskScoreVendorScoringAnswerType.BOOLEAN,
  answerOptionsText: '',
}

export const toQuestionFormData = (question: TVendorScoringQuestionDef): TVendorScoringQuestionFormData => ({
  name: question.name,
  description: question.description ?? '',
  category: question.category,
  suggestedImpact: question.suggestedImpact,
  answerType: question.answerType,
  answerOptionsText: question.answerOptions?.join('\n') ?? '',
})

export const toQuestionDraftValues = ({ answerOptionsText, ...values }: TVendorScoringQuestionFormData): TQuestionDraftValues => ({
  ...values,
  answerOptions: values.answerType === VendorRiskScoreVendorScoringAnswerType.SINGLE_SELECT ? toOptionLines(answerOptionsText) : undefined,
})

export const useVendorScoringQuestionForm = (defaultValues: TVendorScoringQuestionFormData) =>
  useForm<TVendorScoringQuestionFormData>({ resolver: zodResolver(questionFormSchema), defaultValues, mode: 'onChange' })
