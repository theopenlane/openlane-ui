'use client'

import React, { useMemo, useState } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { ArrowRight, CircleHelp, FileText, Layers, SquareArrowOutUpRight, X } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { FormItem, FormLabel } from '@repo/ui/form'
import { useTemplateSelect } from '@/lib/graphql-hooks/template'
import { TemplateTemplateKind } from '@repo/codegen/src/schema'
import { type CampaignFormData } from '../../hooks/use-campaign-form-schema'
import { SelectQuestionnaireDialog, type QuestionnaireTemplate } from './select-questionnaire-dialog'
import { getSectionCount, getQuestionCount } from './questionnaire-metrics'

const PREVIEW_PATH = '/automation/questionnaires/templates/template-viewer'

interface QuestionnaireSelectorProps {
  form: UseFormReturn<CampaignFormData>
}

export const QuestionnaireSelector: React.FC<QuestionnaireSelectorProps> = ({ form }) => {
  const { templates, isLoading } = useTemplateSelect({ where: { kind: TemplateTemplateKind.QUESTIONNAIRE } })
  const [dialogOpen, setDialogOpen] = useState(false)

  const selectedId = form.watch('questionnaireTemplateID')
  const selected = useMemo(() => templates?.find((template) => template.id === selectedId), [templates, selectedId])

  const handleSelect = (template: QuestionnaireTemplate) => {
    form.setValue('questionnaireTemplateID', template.id, { shouldDirty: true })
    if (form.getValues('emailTemplateID')) {
      form.setValue('emailTemplateID', '', { shouldDirty: true })
    }
    if (!form.getValues('name')?.trim()) {
      form.setValue('name', template.name, { shouldDirty: true, shouldValidate: true })
    }
    if (!form.getValues('description')?.trim()) {
      form.setValue('description', template.description ?? '', { shouldDirty: true })
    }
    setDialogOpen(false)
  }

  const handleClear = () => form.setValue('questionnaireTemplateID', '', { shouldDirty: true })

  const openPreview = (id: string) => window.open(`${PREVIEW_PATH}?id=${id}`, '_blank', 'noopener,noreferrer')

  return (
    <FormItem>
      <FormLabel className="pb-1 block">
        Select Questionnaire Template <span className="text-muted-foreground">(Optional)</span>
      </FormLabel>
      <p className="pb-2 text-xs text-muted-foreground">
        Campaigns use either a questionnaire template or an email template. With a questionnaire template, recipients receive the system email template.
      </p>

      {selected ? (
        <div className="flex flex-col gap-3 rounded-md border border-border p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col">
              <span className="text-sm font-medium">{selected.name}</span>
              {selected.description && <span className="text-xs text-muted-foreground">{selected.description}</span>}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button type="button" className="text-sm text-link hover:underline" onClick={() => setDialogOpen(true)}>
                Change
              </button>
              <button type="button" aria-label="Remove questionnaire" className="text-muted-foreground" onClick={handleClear}>
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Layers size={14} /> {getSectionCount(selected.jsonconfig)} sections
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CircleHelp size={14} /> {getQuestionCount(selected.jsonconfig)} questions
              </span>
            </div>
            <Button variant="secondary" type="button" onClick={() => openPreview(selected.id)}>
              Preview Questionnaire Template <SquareArrowOutUpRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border p-8 text-center hover:bg-muted/50"
        >
          <FileText size={28} />
          <span className="text-sm font-medium">No questionnaire template selected</span>
          <span className="text-xs text-muted-foreground">Participants will only receive the campaign email.</span>
          <span className="inline-flex items-center gap-1 text-sm text-link">
            Click to select a questionnaire template <ArrowRight size={14} />
          </span>
        </button>
      )}

      <SelectQuestionnaireDialog open={dialogOpen} onOpenChange={setDialogOpen} templates={templates ?? []} isLoading={isLoading} selectedId={selectedId} onSelect={handleSelect} />
    </FormItem>
  )
}
