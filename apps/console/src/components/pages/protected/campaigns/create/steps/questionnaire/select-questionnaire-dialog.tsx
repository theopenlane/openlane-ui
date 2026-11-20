'use client'

import React, { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Check, LoaderCircle, SearchIcon } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import { Link } from '@/components/shared/link/link'
import { useAssessmentPickerOptions } from '@/lib/graphql-hooks/assessment'
import { useAsyncCommandSearch } from '@/hooks/useAsyncCommandSearch'
import { useFetchNextPageOnVisible } from '@/hooks/useFetchNextPageOnVisible'
import { formatDate } from '@/utils/date'
import { isOneOf } from '@/utils/type-guards'
import {
  describeLinkedPolicies,
  QUESTIONNAIRE_SOURCES,
  questionnaireHref,
  type QuestionnaireTemplate,
  type TQuestionnaireChoice,
  type TQuestionnaireRef,
  type TQuestionnaireSource,
} from '../../../questionnaire-source'

const CREATE_TEMPLATE_PATH = '/automation/questionnaires/templates/template-editor'
const QUESTIONNAIRES_PATH = '/automation/questionnaires'

const isQuestionnaireSource = isOneOf(QUESTIONNAIRE_SOURCES)

interface SelectQuestionnaireDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templates: QuestionnaireTemplate[]
  isLoading: boolean
  selected?: TQuestionnaireRef
  onSelect: (choice: TQuestionnaireChoice) => void
}

export const SelectQuestionnaireDialog: React.FC<SelectQuestionnaireDialogProps> = ({ open, onOpenChange, ...bodyProps }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="flex max-w-2xl min-w-0 flex-col">
      <DialogHeader>
        <DialogTitle>Select Questionnaire</DialogTitle>
        <p className="text-sm text-muted-foreground">
          Use a questionnaire template to create a fresh questionnaire for this campaign, or pick an existing questionnaire, such as a policy sign-off, to send it as is.
        </p>
      </DialogHeader>
      <SelectQuestionnaireBody {...bodyProps} onClose={() => onOpenChange(false)} />
    </DialogContent>
  </Dialog>
)

type SelectQuestionnaireBodyProps = Omit<SelectQuestionnaireDialogProps, 'open' | 'onOpenChange'> & { onClose: () => void }

const SelectQuestionnaireBody: React.FC<SelectQuestionnaireBodyProps> = ({ templates, isLoading, selected, onSelect, onClose }) => {
  const [tab, setTab] = useState<TQuestionnaireSource>(selected?.source ?? 'template')
  const { searchText, setSearchText, term, debouncedTerm, getIsSearching } = useAsyncCommandSearch()

  const filteredTemplates = useMemo(() => {
    const query = term.toLowerCase()
    if (!query) return templates
    return templates.filter((template) => template.name?.toLowerCase().includes(query) || template.description?.toLowerCase().includes(query))
  }, [templates, term])

  const assessmentWhere = useMemo(() => (debouncedTerm ? { nameContainsFold: debouncedTerm } : undefined), [debouncedTerm])
  const {
    options: assessments,
    totalCount: assessmentTotal,
    isPending: assessmentsPending,
    isPlaceholderData: assessmentsPlaceholder,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  } = useAssessmentPickerOptions({ where: assessmentWhere, enabled: tab === 'assessment' })
  const isSearchingAssessments = getIsSearching(assessmentsPlaceholder)
  const sentinelRef = useFetchNextPageOnVisible({ hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage })

  const isTemplateTab = tab === 'template'
  const selectedId = selected?.source === tab ? selected.id : undefined

  return (
    <>
      <Tabs panelless variant="solid" value={tab} onValueChange={(value) => isQuestionnaireSource(value) && setTab(value)}>
        <TabsList className="w-fit">
          <TabsTrigger value="template">Templates</TabsTrigger>
          <TabsTrigger value="assessment">Questionnaires</TabsTrigger>
        </TabsList>
      </Tabs>

      <Input
        className="w-full"
        icon={!isTemplateTab && isSearchingAssessments ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
        iconPosition="left"
        placeholder={isTemplateTab ? 'Search questionnaire templates...' : 'Search questionnaires...'}
        value={searchText}
        onChange={(e) => setSearchText(e.currentTarget.value)}
      />

      <div className="flex max-h-96 flex-col divide-y divide-border overflow-y-auto rounded-md border border-border">
        {isTemplateTab ? (
          isLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading questionnaire templates...</div>
          ) : filteredTemplates.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No questionnaire templates found.</div>
          ) : (
            filteredTemplates.map((template) => (
              <QuestionnaireOptionRow
                key={template.id}
                name={template.name}
                detail={template.description ?? undefined}
                isSelected={selectedId === template.id}
                previewHref={questionnaireHref({ source: 'template', id: template.id })}
                onSelect={() => onSelect({ source: 'template', template })}
              />
            ))
          )
        ) : assessmentsPending || isSearchingAssessments ? (
          <div className="p-4 text-sm text-muted-foreground">{assessmentsPending ? 'Loading questionnaires...' : 'Searching questionnaires...'}</div>
        ) : assessments.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No questionnaires found.</div>
        ) : (
          <>
            {assessments.map((assessment) => (
              <QuestionnaireOptionRow
                key={assessment.id}
                name={assessment.name}
                detail={`${describeLinkedPolicies(assessment.internalPolicies.totalCount)} · Updated ${formatDate(assessment.updatedAt)}`}
                isSelected={selectedId === assessment.id}
                previewHref={questionnaireHref({ source: 'assessment', id: assessment.id })}
                onSelect={() => onSelect({ source: 'assessment', assessment })}
              />
            ))}
            {hasNextPage && (
              <div ref={sentinelRef} className="flex items-center justify-center gap-2 p-3 text-xs text-muted-foreground">
                {isFetchNextPageError ? (
                  <Button variant="link" type="button" className="font-normal" onClick={() => fetchNextPage()}>
                    Couldn&apos;t load more questionnaires. Retry
                  </Button>
                ) : (
                  `Showing ${assessments.length} of ${assessmentTotal}. Loading more...`
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Can&apos;t find what you&apos;re looking for?</span>
          <Link href={isTemplateTab ? CREATE_TEMPLATE_PATH : QUESTIONNAIRES_PATH} newTab className="text-sm">
            {isTemplateTab ? 'Create new questionnaire template' : 'Manage questionnaires'}
          </Link>
        </div>
        <Button variant="secondary" type="button" onClick={onClose}>
          Close
        </Button>
      </div>
    </>
  )
}

interface QuestionnaireOptionRowProps {
  name: string
  detail?: string
  isSelected: boolean
  previewHref: string
  onSelect: () => void
}

const QuestionnaireOptionRow: React.FC<QuestionnaireOptionRowProps> = ({ name, detail, isSelected, previewHref, onSelect }) => (
  <div className={cn('flex items-center justify-between gap-4 pr-3 hover:bg-muted', isSelected && 'bg-primary/10 hover:bg-primary/10')}>
    <Button
      variant="transparent"
      type="button"
      aria-pressed={isSelected}
      onClick={onSelect}
      className="h-auto min-w-0 flex-1 justify-start overflow-hidden rounded-none border-0 p-3 text-left font-normal whitespace-normal *:w-full *:min-w-0 hover:border-0 hover:bg-transparent"
    >
      <span className="flex w-full min-w-0 flex-col items-start">
        <span className="text-sm font-medium break-words">{name}</span>
        {detail && <span className="line-clamp-2 text-xs text-muted-foreground">{detail}</span>}
      </span>
    </Button>
    {isSelected && <Check size={16} aria-hidden className="shrink-0 text-primary" />}
    <Link href={previewHref} newTab className="shrink-0 text-sm">
      Preview
    </Link>
  </div>
)
