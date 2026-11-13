'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { VendorRiskScoreVendorRiskImpact, VendorRiskScoreVendorScoringAnswerType, VendorRiskScoreVendorScoringCategory } from '@repo/codegen/src/schema'
import { normalizeAnswerOptions, type TQuestionDraftValues, type TVendorScoringQuestionDef } from '@/lib/vendor-scoring-config'

export const MIN_SELECT_OPTIONS = 2

const toOptionValues = (options: readonly { value: string }[] | undefined) => normalizeAnswerOptions((options ?? []).map((option) => option.value))

const questionFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Enter the question.'),
    description: z.string().optional(),
    category: z.enum(VendorRiskScoreVendorScoringCategory),
    defaultImpact: z.enum(VendorRiskScoreVendorRiskImpact),
    answerType: z.enum(VendorRiskScoreVendorScoringAnswerType),
    answerOptions: z.array(z.object({ value: z.string() })),
  })
  .refine((values) => values.answerType !== VendorRiskScoreVendorScoringAnswerType.SINGLE_SELECT || toOptionValues(values.answerOptions).length >= MIN_SELECT_OPTIONS, {
    path: ['answerOptions'],
    error: 'Add at least two options',
  })

export type TVendorScoringQuestionFormData = z.infer<typeof questionFormSchema>

const emptyOptionRows = (count: number) => Array.from({ length: Math.max(0, count) }, () => ({ value: '' }))

const toOptionRows = (options: readonly string[] | undefined) => {
  const rows = (options ?? []).map((value) => ({ value }))
  return [...rows, ...emptyOptionRows(MIN_SELECT_OPTIONS - rows.length)]
}

export const NEW_QUESTION_DEFAULTS: TVendorScoringQuestionFormData = {
  name: '',
  description: '',
  category: VendorRiskScoreVendorScoringCategory.SECURITY_PRACTICES,
  defaultImpact: VendorRiskScoreVendorRiskImpact.MEDIUM,
  answerType: VendorRiskScoreVendorScoringAnswerType.BOOLEAN,
  answerOptions: emptyOptionRows(MIN_SELECT_OPTIONS),
}

export const toQuestionFormData = (question: TVendorScoringQuestionDef): TVendorScoringQuestionFormData => ({
  name: question.name,
  description: question.description ?? '',
  category: question.category,
  defaultImpact: question.suggestedImpact,
  answerType: question.answerType,
  answerOptions: toOptionRows(question.answerOptions),
})

export const toQuestionDraftValues = ({ answerOptions, defaultImpact, ...values }: TVendorScoringQuestionFormData): TQuestionDraftValues => ({
  ...values,
  suggestedImpact: defaultImpact,
  answerOptions: values.answerType === VendorRiskScoreVendorScoringAnswerType.SINGLE_SELECT ? toOptionValues(answerOptions) : undefined,
})

export const useVendorScoringQuestionForm = (defaultValues: TVendorScoringQuestionFormData) =>
  useForm<TVendorScoringQuestionFormData>({ resolver: zodResolver(questionFormSchema), defaultValues, mode: 'onChange' })
