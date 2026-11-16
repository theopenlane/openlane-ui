'use client'

import React, { useEffect } from 'react'
import { useFieldArray, useWatch } from 'react-hook-form'
import { Info, Plus, RotateCcw, X } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form'
import { Textarea } from '@repo/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { RadioGroup, RadioGroupItem } from '@repo/ui/radio-group'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { cn } from '@repo/ui/lib/utils'
import { VendorRiskScoreVendorScoringAnswerType, VendorRiskScoreVendorScoringCategory } from '@repo/codegen/src/schema'
import { enumToOptions, getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { formatList } from '@/utils/strings'
import { ANSWER_TYPE_COPY, ANSWER_TYPE_ORDER } from '../vendor-scoring-copy'
import { getEditedQuestionFields, IMPACT_ORDER, type TEditableQuestionField, type TQuestionDraftValues, type TVendorScoringQuestionDef } from '@/lib/vendor-scoring-config'
import { QuestionOriginBadge } from '../question-origin-badge'
import { MIN_SELECT_OPTIONS, toQuestionDraftValues, toQuestionFormData, useVendorScoringQuestionForm, type TVendorScoringQuestionFormData } from './use-vendor-scoring-question-form-schema'

export const VENDOR_SCORING_QUESTION_FORM_ID = 'vendor-scoring-question-form'

const CATEGORY_OPTIONS = enumToOptions(VendorRiskScoreVendorScoringCategory)

const DEFAULT_IMPACT_HINT = 'The starting impact for this question. You can adjust it for each vendor when answering.'

const DEFAULT_DESCRIPTION: Record<TEditableQuestionField, (question: TVendorScoringQuestionDef) => string> = {
  name: (question) => question.name,
  description: (question) => question.description?.trim() || 'Empty',
  category: (question) => getEnumLabel(question.category),
  suggestedImpact: (question) => getEnumLabel(question.suggestedImpact),
  answerType: (question) => ANSWER_TYPE_COPY[question.answerType].label,
  answerOptions: (question) => formatList(question.answerOptions ?? [], 'conjunction') || 'None',
}

type TEditedTagProps = { field: TEditableQuestionField; edited: ReadonlySet<TEditableQuestionField>; openlaneDefault: TVendorScoringQuestionDef | undefined }

const EditedTag = ({ field, edited, openlaneDefault }: TEditedTagProps) =>
  openlaneDefault && edited.has(field) ? (
    <SystemTooltip
      portal
      icon={
        <span className="inline-flex">
          <QuestionOriginBadge origin="edited" />
        </span>
      }
      content={`Openlane default: ${DEFAULT_DESCRIPTION[field](openlaneDefault)}`}
    />
  ) : null

const FieldLabel = ({ children, required, hint, ...tag }: TEditedTagProps & { children: React.ReactNode; required?: boolean; hint?: string }) => (
  <div className="flex items-center gap-2">
    <FormLabel required={required}>{children}</FormLabel>
    {hint && <SystemTooltip portal icon={<Info size={14} className="text-muted-foreground" aria-label={hint} />} content={hint} />}
    <EditedTag {...tag} />
  </div>
)

const NO_EDITS: ReadonlySet<TEditableQuestionField> = new Set()

type TVendorScoringQuestionFormProps = {
  defaultValues: TVendorScoringQuestionFormData
  openlaneDefault?: TVendorScoringQuestionDef
  lockedReason?: { category?: string; answerType?: string }
  onDirtyChange: (isDirty: boolean) => void
  onSubmit: (values: TQuestionDraftValues) => void
}

export const VendorScoringQuestionForm: React.FC<TVendorScoringQuestionFormProps> = ({ defaultValues, openlaneDefault, lockedReason, onDirtyChange, onSubmit }) => {
  const form = useVendorScoringQuestionForm(defaultValues)
  const { fields: optionRows, append: appendOption, remove: removeOption } = useFieldArray({ control: form.control, name: 'answerOptions' })
  const answerType = useWatch({ control: form.control, name: 'answerType' })
  const watched = useWatch({ control: form.control, disabled: !openlaneDefault })
  const isDirty = form.formState.isDirty

  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange])

  const edited = openlaneDefault && watched ? getEditedQuestionFields(toQuestionDraftValues(form.getValues()), openlaneDefault) : NO_EDITS

  const resetToDefault = () => {
    if (!openlaneDefault) return
    form.reset(toQuestionFormData(openlaneDefault), { keepDefaultValues: true })
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.stopPropagation()
    form.handleSubmit((submitted) => onSubmit(toQuestionDraftValues(submitted)))(event)
  }

  const tag = { edited, openlaneDefault }
  const optionsError = form.formState.errors.answerOptions?.root?.message ?? form.formState.errors.answerOptions?.message

  return (
    <Form {...form}>
      <form id={VENDOR_SCORING_QUESTION_FORM_ID} onSubmit={handleSubmit} className="flex flex-col gap-4">
        {openlaneDefault && edited.size > 0 && (
          <div className="flex justify-end">
            <Button type="button" variant="secondary" icon={<RotateCcw size={16} />} iconPosition="left" onClick={resetToDefault}>
              Reset to default
            </Button>
          </div>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FieldLabel field="name" required {...tag}>
                Question
              </FieldLabel>
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
              <FieldLabel field="description" {...tag}>
                Why it matters <span className="font-normal text-muted-foreground">(optional)</span>
              </FieldLabel>
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
                <FieldLabel field="category" {...tag}>
                  Category
                </FieldLabel>
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
            name="defaultImpact"
            render={({ field }) => (
              <FormItem>
                <FieldLabel field="suggestedImpact" hint={DEFAULT_IMPACT_HINT} {...tag}>
                  Default impact
                </FieldLabel>
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
              <FieldLabel field="answerType" {...tag}>
                Answer type
              </FieldLabel>
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
            name="answerOptions"
            render={() => (
              <FormItem className="flex flex-col gap-2">
                <FieldLabel field="answerOptions" required {...tag}>
                  Answer options
                </FieldLabel>
                {optionRows.map((row, index) => (
                  <FormField
                    key={row.id}
                    control={form.control}
                    name={`answerOptions.${index}.value`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-normal text-muted-foreground">Option {index + 1}</FormLabel>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Input placeholder="Enter an option" {...field} />
                          </FormControl>
                          {optionRows.length > MIN_SELECT_OPTIONS && (
                            <Button
                              type="button"
                              variant="transparent"
                              size="icon-sm"
                              icon={<X size={16} />}
                              descriptiveTooltipText={`Remove option ${index + 1}`}
                              onClick={() => removeOption(index)}
                            />
                          )}
                        </div>
                      </FormItem>
                    )}
                  />
                ))}
                <div>
                  <Button type="button" variant="secondary" icon={<Plus size={16} />} iconPosition="left" onClick={() => appendOption({ value: '' })}>
                    Add option
                  </Button>
                </div>
                {optionsError && <p className="text-sm text-destructive">{optionsError}</p>}
              </FormItem>
            )}
          />
        )}
      </form>
    </Form>
  )
}
