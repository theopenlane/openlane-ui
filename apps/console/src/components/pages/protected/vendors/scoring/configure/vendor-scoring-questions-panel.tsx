'use client'

import React, { useMemo } from 'react'
import { ChevronDown, ChevronRight, Plus, SearchIcon } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { type VendorRiskScoreVendorScoringCategory } from '@repo/codegen/src/schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import EmptyTabState from '@/components/shared/crud-base/tabs/empty-tab-state'
import { questionOrigin, type TDraftQuestion } from '@/lib/vendor-scoring-config'
import { VendorScoringQuestionRow } from './vendor-scoring-question-row'
import { isOneOf } from '@/utils/type-guards'

const QUESTION_FILTERS = ['all', 'on', 'off', 'changed'] as const

export type TQuestionFilter = (typeof QUESTION_FILTERS)[number]

const QUESTION_FILTER_LABEL: Record<TQuestionFilter, string> = { all: 'All', on: 'On', off: 'Off', changed: 'Changed' }

const isQuestionFilter = isOneOf(QUESTION_FILTERS)

const QUESTION_FILTER_PREDICATE: Record<TQuestionFilter, (question: TDraftQuestion) => boolean> = {
  all: () => true,
  on: (question) => question.enabled,
  off: (question) => !question.enabled,
  changed: (question) => questionOrigin(question) !== 'default',
}

type TCategoryGroup = {
  category: VendorRiskScoreVendorScoringCategory
  questions: TDraftQuestion[]
  enabledCount: number
  totalCount: number
}

const groupByCategory = (all: TDraftQuestion[], visible: TDraftQuestion[]): TCategoryGroup[] => {
  const groups = new Map<VendorRiskScoreVendorScoringCategory, TCategoryGroup>()
  all.forEach((question) => {
    const group = groups.get(question.category) ?? { category: question.category, questions: [], enabledCount: 0, totalCount: 0 }
    group.totalCount += 1
    if (question.enabled) group.enabledCount += 1
    groups.set(question.category, group)
  })
  visible.forEach((question) => groups.get(question.category)?.questions.push(question))
  return [...groups.values()].filter((group) => group.questions.length > 0)
}

type TVendorScoringQuestionsPanelProps = {
  questions: TDraftQuestion[]
  readOnly: boolean
  search: string
  onSearchChange: (search: string) => void
  filter: TQuestionFilter
  onFilterChange: (filter: TQuestionFilter) => void
  collapsedCategories: ReadonlySet<VendorRiskScoreVendorScoringCategory>
  onCollapsedCategoriesChange: (collapsed: ReadonlySet<VendorRiskScoreVendorScoringCategory>) => void
  onAdd: () => void
  onToggle: (draftId: string, enabled: boolean) => void
  onEdit: (draftId: string) => void
  onReset: (draftId: string) => void
  onRemove: (draftId: string) => void
}

export const VendorScoringQuestionsPanel: React.FC<TVendorScoringQuestionsPanelProps> = ({
  questions,
  readOnly,
  search,
  onSearchChange,
  filter,
  onFilterChange,
  collapsedCategories,
  onCollapsedCategoriesChange,
  onAdd,
  onToggle,
  onEdit,
  onReset,
  onRemove,
}) => {
  const term = search.trim().toLowerCase()
  const visible = useMemo(
    () => questions.filter((question) => QUESTION_FILTER_PREDICATE[filter](question) && (!term || question.name.toLowerCase().includes(term) || question.key.toLowerCase().includes(term))),
    [questions, filter, term],
  )
  const groups = useMemo(() => groupByCategory(questions, visible), [questions, visible])

  const toggleGroup = (category: VendorRiskScoreVendorScoringCategory) => {
    const next = new Set(collapsedCategories)
    if (next.has(category)) next.delete(category)
    else next.add(category)
    onCollapsedCategoriesChange(next)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-48 flex-1">
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search questions"
            aria-label="Search questions"
            icon={<SearchIcon size={16} />}
            iconPosition="left"
            variant="searchTable"
          />
        </div>
        <Tabs variant="solid" value={filter} onValueChange={(value) => isQuestionFilter(value) && onFilterChange(value)}>
          <TabsList className="w-fit">
            {QUESTION_FILTERS.map((option) => (
              <TabsTrigger key={option} value={option}>
                {QUESTION_FILTER_LABEL[option]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {!readOnly && (
          <Button type="button" icon={<Plus size={16} />} iconPosition="left" onClick={onAdd}>
            Add question
          </Button>
        )}
      </div>

      {groups.length === 0 ? (
        <EmptyTabState description={term ? `No questions match "${search.trim()}".` : 'No questions match this filter.'} />
      ) : (
        <div className="flex flex-col gap-2">
          {groups.map((group) => {
            const isFiltering = !!term || filter !== 'all'
            const isOpen = isFiltering || !collapsedCategories.has(group.category)
            const label = getEnumLabel(group.category)
            const header = (
              <>
                <span className="flex items-center gap-2 font-medium">
                  {isFiltering ? null : isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  {label}
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  {group.enabledCount} of {group.totalCount} on
                </span>
              </>
            )
            return (
              <section key={group.category} className="rounded-lg border bg-card">
                {isFiltering ? (
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm">{header}</div>
                ) : (
                  <Button
                    type="button"
                    variant="transparent"
                    className="h-auto w-full justify-between rounded-lg px-3 py-2.5 hover:border-transparent"
                    aria-expanded={isOpen}
                    onClick={() => toggleGroup(group.category)}
                  >
                    <span className="flex w-full items-center justify-between gap-2">{header}</span>
                  </Button>
                )}
                {isOpen && (
                  <ul className="divide-y border-t" aria-label={`${label} questions`}>
                    {group.questions.map((question) => (
                      <VendorScoringQuestionRow
                        key={question.draftId}
                        question={question}
                        readOnly={readOnly}
                        onToggle={(enabled) => onToggle(question.draftId, enabled)}
                        onEdit={() => onEdit(question.draftId)}
                        onReset={() => onReset(question.draftId)}
                        onRemove={() => onRemove(question.draftId)}
                      />
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
