'use client'

import React, { useMemo, useState } from 'react'
import { ChevronDown, SearchIcon } from 'lucide-react'
import { Checkbox } from '@repo/ui/checkbox'
import { Input } from '@repo/ui/input'
import { Separator } from '@repo/ui/separator'
import { activatable } from '@repo/ui/lib/a11y'
import { cn } from '@repo/ui/lib/utils'
import { pluralizeWithCount } from '@/utils/strings'
import { SectionCard } from '../../shared/section-card'
import { SelectAllCheckbox } from '../../shared/select-all-checkbox'
import { selectionCheckedState, setAllSelected, toggleSetValue } from '../../shared/selection-utils'
import { ShowAllFooter, useShowAll } from '../components/show-all-footer'
import type { ReportControl, ReportReview } from '../types'

const INITIAL_VISIBLE_GROUPS = 6

const UNLINKED_GROUP_KEY = ''

type ReviewGroup = { refCode: string; title: string; reviews: ReportReview[] }

type ReviewsStepProps = {
  reviews: ReportReview[]
  controls: ReportControl[]
  selected: Set<string>
  setSelected: React.Dispatch<React.SetStateAction<Set<string>>>
}

const matchesSearch = (review: ReportReview, term: string) => [review.title, review.summary, review.details, ...review.refCodes].some((value) => value?.toLowerCase().includes(term))

type ControlLookup = Map<string, { title: string; position: number }>

const groupReviews = (reviews: ReportReview[], controlsByRef: ControlLookup): ReviewGroup[] => {
  const groups = new Map<string, ReportReview[]>()
  reviews.forEach((review) => {
    const key = review.refCodes[0] ?? UNLINKED_GROUP_KEY
    const group = groups.get(key)
    if (group) {
      group.push(review)
    } else {
      groups.set(key, [review])
    }
  })

  const positionOf = (refCode: string) => controlsByRef.get(refCode)?.position ?? Number.MAX_SAFE_INTEGER

  return [...groups.entries()]
    .sort(([a], [b]) => positionOf(a) - positionOf(b))
    .map(([refCode, groupReviews]) => ({
      refCode,
      title: refCode === UNLINKED_GROUP_KEY ? 'Not linked to a control' : (controlsByRef.get(refCode)?.title ?? refCode),
      reviews: groupReviews,
    }))
}

type ReviewGroupRowProps = { group: ReviewGroup; selected: Set<string>; setSelected: ReviewsStepProps['setSelected']; defaultOpen: boolean; forceOpen: boolean }

const ReviewGroupRow = ({ group, selected, setSelected, defaultOpen, forceOpen }: ReviewGroupRowProps) => {
  const [expanded, setExpanded] = useState(defaultOpen)
  const open = forceOpen || expanded
  const ids = group.reviews.map((review) => review.id)
  const { selectedCount, allSelected, checkedState } = selectionCheckedState(ids, selected)

  return (
    <div>
      <div className="flex items-center gap-4 bg-muted/40 px-6 py-3">
        <Checkbox checked={checkedState} onCheckedChange={() => setAllSelected(setSelected, ids, !allSelected)} aria-label={`Select reviews for ${group.title}`} />
        <div className="flex min-w-0 flex-1 cursor-pointer items-center gap-4 select-none" {...activatable(forceOpen ? undefined : () => setExpanded((value) => !value))} aria-expanded={open}>
          {group.refCode ? <span className="shrink-0 font-mono text-sm text-primary">{group.refCode}</span> : null}
          <span className="truncate text-sm font-semibold">{group.title}</span>
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
            {selectedCount} of {pluralizeWithCount(ids.length, 'review')}
          </span>
          <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', !open && '-rotate-90')} />
        </div>
      </div>
      {open
        ? group.reviews.map((review) => (
            <div key={review.id} className="flex items-start gap-4 border-t border-border py-3 pr-6 pl-12">
              <div className="pt-0.5">
                <Checkbox checked={selected.has(review.id)} onCheckedChange={() => toggleSetValue(setSelected, review.id)} aria-label={`Select ${review.title}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{review.title}</p>
                {review.details || review.summary ? <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{review.details || review.summary}</p> : null}
              </div>
            </div>
          ))
        : null}
    </div>
  )
}

export const ReviewsStep = ({ reviews, controls, selected, setSelected }: ReviewsStepProps) => {
  const [search, setSearch] = useState('')
  const controlsByRef: ControlLookup = useMemo(() => new Map(controls.map((control, position) => [control.refCode, { title: control.title ?? control.refCode, position }])), [controls])
  const term = search.trim().toLowerCase()
  const groups = useMemo(() => groupReviews(term ? reviews.filter((review) => matchesSearch(review, term)) : reviews, controlsByRef), [reviews, term, controlsByRef])
  const { visible: visibleGroups, hiddenCount: hiddenGroupCount, expand } = useShowAll(groups, term ? groups.length : INITIAL_VISIBLE_GROUPS)

  return (
    <SectionCard
      title="Review the auditor's reviews"
      description="Each review is what the auditor wrote, the procedure they performed in their words. There are usually hundreds, so they are grouped under the control each one tests."
      titleAction={<SelectAllCheckbox ids={groups.flatMap((group) => group.reviews.map((review) => review.id))} selected={selected} setSelected={setSelected} />}
      footer={
        hiddenGroupCount > 0 ? (
          <ShowAllFooter summary={`Showing ${visibleGroups.length} of ${pluralizeWithCount(groups.length, 'control')} · ${pluralizeWithCount(reviews.length, 'review')}`} onShowAll={expand} />
        ) : undefined
      }
    >
      <div className="px-6 py-3">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reviews" icon={<SearchIcon size={16} />} className="max-w-sm" aria-label="Search reviews" />
      </div>
      {visibleGroups.length === 0 ? <p className="px-6 pb-4 text-sm text-muted-foreground">No reviews match your search.</p> : null}
      {visibleGroups.map((group, index) => (
        <React.Fragment key={group.refCode}>
          <Separator separatorClass="bg-border" />
          <ReviewGroupRow group={group} selected={selected} setSelected={setSelected} defaultOpen={index === 0} forceOpen={!!term} />
        </React.Fragment>
      ))}
    </SectionCard>
  )
}
