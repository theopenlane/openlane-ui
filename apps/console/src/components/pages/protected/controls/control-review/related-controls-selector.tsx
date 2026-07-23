'use client'

import React, { useMemo, useState } from 'react'
import { useWatch, type UseFormReturn } from 'react-hook-form'
import { ChevronDown } from 'lucide-react'
import { Checkbox } from '@repo/ui/checkbox'
import { useGetControlById, useGetControlRelatedControls } from '@/lib/graphql-hooks/control'
import { getEdgeNodes } from '@/components/shared/object-association/utils'
import StandardChip from '@/components/pages/protected/standards/shared/standard-chip'
import { type ControlReviewFormData } from './use-control-review-form-schema'

type TRelatedItem = { id: string; refCode: string; field: 'linkedControlIDs' | 'linkedSubcontrolIDs' }

type TRelatedGroup = { key: string; label?: string; framework?: string; items: TRelatedItem[] }

type TRelatedControlsSelectorProps = {
  form: UseFormReturn<ControlReviewFormData>
  controlId: string
}

const RelatedControlsSelector: React.FC<TRelatedControlsSelectorProps> = ({ form, controlId }) => {
  const [expanded, setExpanded] = useState(false)

  const { data: controlData } = useGetControlById(controlId)
  const { data: relatedData } = useGetControlRelatedControls(controlId)

  const groups = useMemo<TRelatedGroup[]>(() => {
    const byKey = new Map<string, TRelatedGroup>()
    const add = (group: Omit<TRelatedGroup, 'items'>, item: TRelatedItem) => {
      const existing = byKey.get(group.key)
      if (existing) {
        existing.items.push(item)
      } else {
        byKey.set(group.key, { ...group, items: [item] })
      }
    }

    getEdgeNodes(controlData?.control?.subcontrols?.edges).forEach((sub) => add({ key: 'subcontrols', label: 'Subcontrols' }, { id: sub.id, refCode: sub.refCode, field: 'linkedSubcontrolIDs' }))

    ;(relatedData?.control?.relatedControls ?? [])
      .filter((related) => related.referenceFramework !== 'OTS')
      .forEach((related) => {
        const framework = related.referenceFramework ?? undefined
        add({ key: framework ?? 'custom', framework }, { id: related.id, refCode: related.refCode, field: related.isSubcontrol ? 'linkedSubcontrolIDs' : 'linkedControlIDs' })
      })

    return Array.from(byKey.values())
  }, [controlData, relatedData])

  const totalCount = useMemo(() => groups.reduce((sum, group) => sum + group.items.length, 0), [groups])

  const selectedControlIDs = useWatch({ control: form.control, name: 'linkedControlIDs' })
  const selectedSubcontrolIDs = useWatch({ control: form.control, name: 'linkedSubcontrolIDs' })

  const selectedControls = useMemo(() => new Set(selectedControlIDs), [selectedControlIDs])
  const selectedSubcontrols = useMemo(() => new Set(selectedSubcontrolIDs), [selectedSubcontrolIDs])

  if (totalCount === 0) {
    return null
  }

  const isItemSelected = (item: TRelatedItem) => (item.field === 'linkedSubcontrolIDs' ? selectedSubcontrols : selectedControls).has(item.id)

  const toggleId = (field: TRelatedItem['field'], id: string, checked: boolean) => {
    const current = form.getValues(field)
    form.setValue(field, checked ? [...current, id] : current.filter((value) => value !== id))
  }

  const setGroupSelection = (items: TRelatedItem[], checked: boolean) => {
    const apply = (field: TRelatedItem['field']) => {
      const groupIds = new Set(items.filter((item) => item.field === field).map((item) => item.id))
      if (groupIds.size === 0) {
        return
      }
      const current = form.getValues(field)
      form.setValue(field, checked ? Array.from(new Set([...current, ...groupIds])) : current.filter((id) => !groupIds.has(id)))
    }

    apply('linkedControlIDs')
    apply('linkedSubcontrolIDs')
  }

  return (
    <div className="flex flex-col gap-2">
      <button type="button" className="group flex items-center gap-2 text-sm text-muted-foreground self-start" onClick={() => setExpanded((prev) => !prev)}>
        <ChevronDown size={16} className={`transition-transform ${expanded ? '' : '-rotate-90'}`} />
        <span>Also link to related controls</span>
        <span className="rounded-full border border-border text-xs flex items-center justify-center h-5 min-w-5 px-1">{totalCount}</span>
      </button>
      {expanded && (
        <div className="flex flex-col gap-4 pl-1">
          {groups.map((group) => (
            <div key={group.key} className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={group.items.every(isItemSelected)} onCheckedChange={(checked) => setGroupSelection(group.items, checked === true)} />
                {group.label ? <span className="font-medium">{group.label}</span> : <StandardChip referenceFramework={group.framework} />}
                <span className="text-xs text-muted-foreground">Select all</span>
              </label>
              <div className="flex flex-col gap-2 pl-6">
                {group.items.map((item) => (
                  <label key={item.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={isItemSelected(item)} onCheckedChange={(checked) => toggleId(item.field, item.id, checked === true)} />
                    <span>{item.refCode}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default RelatedControlsSelector
