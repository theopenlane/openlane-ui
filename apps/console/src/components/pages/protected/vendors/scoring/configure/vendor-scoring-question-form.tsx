'use client'

import React from 'react'
import { useWatch } from 'react-hook-form'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form'
import { Textarea } from '@repo/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { RadioGroup, RadioGroupItem } from '@repo/ui/radio-group'
import { cn } from '@repo/ui/lib/utils'
import { VendorRiskScoreVendorScoringAnswerType, VendorRiskScoreVendorScoringCategory } from '@repo/codegen/src/schema'
import { enumToOptions, getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { Callout } from '@/components/shared/callout/callout'
import { ANSWER_TYPE_COPY, ANSWER_TYPE_ORDER } from '../vendor-scoring-copy'
import { IMPACT_ORDER } from '@/lib/vendor-scoring-config'
import { toQuestionDraftValues, useVendorScoringQuestionForm, type TVendorScoringQuestionFormData } from './use-vendor-scoring-question-form-schema'
import { type TQuestionDraftValues } from '@/lib/vendor-scoring-config'

export const VENDOR_SCORING_QUESTION_FORM_ID = 'vendor-scoring-question-form'

const CATEGORY_OPTIONS = enumToOptions(VendorRiskScoreVendorScoringCategory)

type TVendorScoringQuestionFormProps = {
  title: string
  defaultValues: TVendorScoringQuestionFormData
  lockedReason?: { category?: string; answerType?: string }
  onBack: () => void
  onSubmit: (values: TQuestionDraftValues) => void
}

export const VendorScoringQuestionForm: React.FC<TVendorScoringQuestionFormProps> = ({ title, defaultValues, lockedReason, onBack, onSubmit }) => {
  const form = useVendorScoringQuestionForm(defaultValues)
  const answerType = useWatch({ control: form.control, name: 'answerType' })

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.stopPropagation()
    form.handleSubmit((values) => onSubmit(toQuestionDraftValues(values)))(event)
  }

  return (
    <Form {...form}>
      <form id={VENDOR_SCORING_QUESTION_FORM_ID} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Button type="button" variant="link" className="text-blue-500" icon={<ChevronLeft size={16} />} iconPosition="left" onClick={onBack}>
            Back to questions
          </Button>
          <h3 className="mt-2 text-base font-medium">{title}</h3>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Question</FormLabel>
              <FormControl>
                <Textarea rows={2} placeholder="Is SAML single sign-on available for our users?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Why it matters <span className="font-normal text-muted-foreground">(optional)</span>
              </FormLabel>
              <FormControl>
                <Textarea rows={2} placeholder="Shown to whoever answers the question" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={!!lockedReason?.category}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {lockedReason?.category && <p className="text-xs text-muted-foreground">{lockedReason.category}</p>}
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="suggestedImpact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Suggested impact</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {IMPACT_ORDER.map((impact) => (
                      <SelectItem key={impact} value={impact}>
                        {getEnumLabel(impact)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="answerType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Answer type</FormLabel>
              <FormControl>
                <RadioGroup value={field.value} onValueChange={field.onChange} disabled={!!lockedReason?.answerType} className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
                  {ANSWER_TYPE_ORDER.map((type) => (
                    <label
                      key={type}
                      className={cn(
                        'flex cursor-pointer items-start gap-2 rounded-md border p-2 text-sm has-[button:disabled]:cursor-not-allowed has-[button:disabled]:opacity-60',
                        field.value === type && 'border-primary bg-primary/5',
                      )}
                    >
                      <RadioGroupItem value={type} className="mt-0.5" />
                      <span className="flex min-w-0 flex-col">
                        <span className="font-medium">{ANSWER_TYPE_COPY[type].label}</span>
                        <span className="text-xs text-muted-foreground">{ANSWER_TYPE_COPY[type].hint}</span>
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </FormControl>
              {lockedReason?.answerType && <p className="text-xs text-muted-foreground">{lockedReason.answerType}</p>}
            </FormItem>
          )}
        />

        {answerType === VendorRiskScoreVendorScoringAnswerType.SINGLE_SELECT && (
          <FormField
            control={form.control}
            name="answerOptionsText"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Options</FormLabel>
                <FormControl>
                  <Textarea rows={4} placeholder="One option per line" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Callout variant="info">Each vendor&apos;s likelihood is set when the question is answered. Impact starts at the suggested value and can be changed per vendor.</Callout>
      </form>
    </Form>
  )
}
