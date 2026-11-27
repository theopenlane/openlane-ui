'use client'

import { useId } from 'react'
import { useWatch, type UseFormReturn } from 'react-hook-form'
import { Link2 } from 'lucide-react'
import { Checkbox } from '@repo/ui/checkbox'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import StandardChip from '@/components/pages/protected/standards/shared/standard-chip'
import { ControlHoverCard } from '@/components/shared/control-tooltip/control-tooltip'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { Link } from '@/components/shared/link/link'
import { StatusLine } from '@/components/shared/status-line/status-line'
import { CUSTOM_STANDARD_FILTER_VALUE } from '@/components/shared/table-filter/custom-standard-filter'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { useCanEditObjects } from '@/lib/authz/use-can-edit-objects'
import { partitionByParent, useMappedControlSuggestions, type TMappingSource, type TSuggestedControl } from '@/lib/query-hooks/use-suggest-controls'
import { controlOrSubcontrolHref } from '@/utils/getHrefForObjectType'
import { type TFormData } from './use-form-schema'

type TMappedControlSuggestionsProps = {
  form: UseFormReturn<TFormData>
  source: TMappingSource
}

type TLinkField = 'controlIDs' | 'subcontrolIDs'

const NO_EDIT_ACCESS_REASON = 'You need edit access to this control to link an implementation to it.'

export const MappedControlSuggestions = ({ form, source }: TMappedControlSuggestionsProps) => {
  const baseId = useId()
  const { suggestions, isPending, error } = useMappedControlSuggestions(source)
  useQueryErrorNotification({ error, description: 'Failed to load mapped controls' })

  const [controlIDs, subcontrolIDs] = useWatch({ control: form.control, name: ['controlIDs', 'subcontrolIDs'] })
  const suggestionIds = partitionByParent(suggestions)
  const canEditControl = useCanEditObjects(ObjectTypes.CONTROL, suggestionIds.controlIds)
  const canEditSubcontrol = useCanEditObjects(ObjectTypes.SUBCONTROL, suggestionIds.subcontrolIds)

  if (isPending) return <StatusLine>Finding mapped controls…</StatusLine>
  if (!suggestions.length) return null

  const selectedIds = new Set([...(controlIDs ?? []), ...(subcontrolIDs ?? [])])
  const isEditable = ({ id, parentControlId }: TSuggestedControl) => (parentControlId ? canEditSubcontrol(id) : canEditControl(id))
  const linkable = suggestions.filter(isEditable)

  const setSelected = (controls: TSuggestedControl[], checked: boolean) => {
    const { controlIds, subcontrolIds } = partitionByParent(controls)
    const apply = (field: TLinkField, ids: string[]) => {
      if (!ids.length) return
      const current = form.getValues(field) ?? []
      const changed = new Set(ids)
      form.setValue(field, checked ? [...new Set([...current, ...ids])] : current.filter((id) => !changed.has(id)), { shouldDirty: true })
    }
    apply('controlIDs', controlIds)
    apply('subcontrolIDs', subcontrolIds)
  }

  const selectedCount = linkable.filter(({ id }) => selectedIds.has(id)).length
  const allState = linkable.length > 0 && selectedCount === linkable.length ? true : selectedCount > 0 ? 'indeterminate' : false
  const headingId = `${baseId}-heading`
  const selectAllId = `${baseId}-all`

  return (
    <section aria-labelledby={headingId} className="mt-4 space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <h3 id={headingId} className="flex items-center gap-2 text-sm font-medium">
            <Link2 size={16} />
            Also link mapped controls
          </h3>
          <p className="text-sm text-muted-foreground">These controls are mapped to this one. The ones you select are linked when the implementation is created.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Checkbox id={selectAllId} checked={allState} disabled={!linkable.length} onCheckedChange={(checked) => setSelected(linkable, checked === true)} />
          <label htmlFor={selectAllId} className="cursor-pointer whitespace-nowrap">
            Select all ({linkable.length})
          </label>
        </div>
      </div>
      <ul className="divide-y rounded-lg border">
        {suggestions.map((control) => {
          const { refCode, title, referenceFramework, parentControlId } = control
          const editable = isEditable(control)

          return (
            <li key={control.id} className="flex items-center gap-3 px-4 py-2 text-sm">
              <DisabledReasonTooltip reason={editable ? undefined : NO_EDIT_ACCESS_REASON}>
                <Checkbox
                  checked={selectedIds.has(control.id)}
                  disabled={!editable}
                  onCheckedChange={(checked) => setSelected([control], checked === true)}
                  aria-label={`Link ${[refCode, title].filter(Boolean).join(' ')} (${referenceFramework || CUSTOM_STANDARD_FILTER_VALUE})`}
                />
              </DisabledReasonTooltip>
              <ControlHoverCard id={control.id} isSubcontrol={!!parentControlId}>
                <Link href={controlOrSubcontrolHref(control)} newTab className="shrink-0">
                  {refCode}
                </Link>
              </ControlHoverCard>
              <span className="min-w-0 flex-1 truncate">{title}</span>
              <StandardChip referenceFramework={referenceFramework ?? undefined} />
            </li>
          )
        })}
      </ul>
    </section>
  )
}
