'use client'

import React, { useMemo, useState } from 'react'
import NextLink from 'next/link'
import { type UseFormReturn } from 'react-hook-form'
import { ArrowRight, Calendar, CircleHelp, ExternalLink, FileText, Layers, ScrollText, X } from 'lucide-react'
import { Button } from '@theopenlane/ui/button'
import { FormItem, FormLabel } from '@theopenlane/ui/form'
import { cn } from '@theopenlane/ui/lib/utils'
import { useTemplateSelect } from '@/lib/graphql-hooks/template'
import { type TAssessmentPickerOption, useAssessmentPickerOption, useSeedAssessmentPickerOption } from '@/lib/graphql-hooks/assessment'
import { TemplateTemplateKind } from '@repo/codegen/src/schema'
import { LINK_CLASS_NAME } from '@/components/shared/link/link'
import { formatDate } from '@/utils/date'
import { type CampaignFormData } from '../../hooks/use-campaign-form-schema'
import { SelectQuestionnaireDialog } from './select-questionnaire-dialog'
import {
  describeLinkedPolicies,
  describeQuestionCount,
  describeSectionCount,
  questionnaireHref,
  questionnaireRefFromChoice,
  type QuestionnaireTemplate,
  type TQuestionnaireChoice,
  type TQuestionnaireRef,
  UNAVAILABLE_QUESTIONNAIRE,
} from '../../../questionnaire-source'

interface QuestionnaireSelectorProps {
  form: UseFormReturn<CampaignFormData>
}

type TStat = { icon: React.ReactNode; label: string }

type TSelectedQuestionnaire = { kindLabel: string; name: string; description?: string | null; stats: TStat[]; previewLabel: string; previewHref: string }

type TResolved<T> = { entity?: T; isPending: boolean }

const describeSelection = (ref: TQuestionnaireRef, template: TResolved<QuestionnaireTemplate>, assessment: TResolved<TAssessmentPickerOption>): TSelectedQuestionnaire => {
  if (ref.source === 'template') {
    const entity = template.entity
    return {
      kindLabel: 'Questionnaire template',
      name: entity?.name ?? (template.isPending ? 'Loading...' : UNAVAILABLE_QUESTIONNAIRE),
      description: entity?.description,
      stats: entity
        ? [
            { icon: <Layers size={14} />, label: describeSectionCount(entity.jsonconfig) },
            { icon: <CircleHelp size={14} />, label: describeQuestionCount(entity.jsonconfig) },
          ]
        : [],
      previewLabel: 'Preview Questionnaire Template',
      previewHref: questionnaireHref(ref),
    }
  }

  const entity = assessment.entity
  return {
    kindLabel: 'Existing questionnaire',
    name: entity?.name ?? (assessment.isPending ? 'Loading...' : UNAVAILABLE_QUESTIONNAIRE),
    stats: entity
      ? [
          { icon: <ScrollText size={14} />, label: describeLinkedPolicies(entity.internalPolicies.totalCount) },
          { icon: <Calendar size={14} />, label: `Updated ${formatDate(entity.updatedAt)}` },
        ]
      : [],
    previewLabel: 'View Questionnaire',
    previewHref: questionnaireHref(ref),
  }
}

export const QuestionnaireSelector: React.FC<QuestionnaireSelectorProps> = ({ form }) => {
  const { templates, isLoading } = useTemplateSelect({ where: { kind: TemplateTemplateKind.QUESTIONNAIRE } })
  const [dialogOpen, setDialogOpen] = useState(false)
  const seedAssessmentOption = useSeedAssessmentPickerOption()

  const selected = form.watch('questionnaire')
  const selectedTemplate = useMemo(() => (selected?.source === 'template' ? templates?.find((template) => template.id === selected.id) : undefined), [templates, selected])
  const { option: selectedAssessment, isPending: assessmentPending } = useAssessmentPickerOption(selected?.source === 'assessment' ? selected.id : undefined)

  const handleSelect = (choice: TQuestionnaireChoice) => {
    const { name, description } = choice.source === 'template' ? choice.template : { name: choice.assessment.name, description: undefined }
    if (choice.source === 'assessment') seedAssessmentOption(choice.assessment)

    const wasQuestionnaire = !!form.getValues('questionnaire')
    form.setValue('questionnaire', questionnaireRefFromChoice(choice), { shouldDirty: true })
    if (!wasQuestionnaire && form.getValues('emailTemplateID')) {
      form.setValue('emailTemplateID', '', { shouldDirty: true })
    }
    if (!form.getValues('name')?.trim()) {
      form.setValue('name', name, { shouldDirty: true, shouldValidate: true })
    }
    if (description && !form.getValues('description')?.trim()) {
      form.setValue('description', description, { shouldDirty: true })
    }
    setDialogOpen(false)
  }

  const handleClear = () => {
    form.setValue('questionnaire', undefined, { shouldDirty: true })
    form.setValue('emailTemplateID', '', { shouldDirty: true })
  }

  const selection = selected ? describeSelection(selected, { entity: selectedTemplate, isPending: isLoading }, { entity: selectedAssessment, isPending: assessmentPending }) : undefined

  return (
    <FormItem>
      <FormLabel className="pb-1 block">
        Select Questionnaire <span className="text-muted-foreground">(Optional)</span>
      </FormLabel>
      <p className="pb-2 text-xs text-muted-foreground">
        Campaigns use either a questionnaire or an email template. With a questionnaire, recipients receive the system email unless you customize it. Pick an existing questionnaire for policy
        sign-off, so completed responses attest its linked policies.
      </p>

      {selection ? (
        <div className="flex flex-col gap-3 rounded-md border border-border p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col">
              <span className="text-xs text-muted-foreground">{selection.kindLabel}</span>
              <span className="text-sm font-medium break-words">{selection.name}</span>
              {selection.description && <span className="text-xs text-muted-foreground">{selection.description}</span>}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Button variant="link" type="button" className="font-normal" onClick={() => setDialogOpen(true)}>
                Change
              </Button>
              <Button variant="icon" size="icon-sm" type="button" aria-label="Remove questionnaire" className="text-muted-foreground" icon={<X />} onClick={handleClear} />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              {selection.stats.map((stat) => (
                <span key={stat.label} className="inline-flex items-center gap-1.5">
                  {stat.icon} {stat.label}
                </span>
              ))}
            </div>
            <Button variant="secondary" asChild icon={<ExternalLink size={14} />}>
              <NextLink href={selection.previewHref} target="_blank" rel="noopener noreferrer" prefetch={false}>
                {selection.previewLabel}
              </NextLink>
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="transparent"
          type="button"
          onClick={() => setDialogOpen(true)}
          className="h-auto w-full rounded-md border border-dashed border-border p-8 text-center font-normal whitespace-normal *:w-full hover:bg-muted/50"
        >
          <span className="flex w-full flex-col items-center justify-center gap-2">
            <FileText className="size-7!" />
            <span className="text-sm font-medium">No questionnaire selected</span>
            <span className="text-xs text-muted-foreground">Participants will only receive the campaign email.</span>
            <span className={cn('inline-flex items-center gap-1 text-sm', LINK_CLASS_NAME)}>
              Click to select a questionnaire <ArrowRight className="size-3.5!" />
            </span>
          </span>
        </Button>
      )}

      <SelectQuestionnaireDialog open={dialogOpen} onOpenChange={setDialogOpen} templates={templates ?? []} isLoading={isLoading} selected={selected} onSelect={handleSelect} />
    </FormItem>
  )
}
