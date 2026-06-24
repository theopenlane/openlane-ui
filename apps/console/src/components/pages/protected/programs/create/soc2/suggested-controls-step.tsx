'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { useAllControlsGroupedWithListFields } from '@/lib/graphql-hooks/control'
import { CheckCircle2, ChevronDown, ChevronRight, Info, ShieldCheck, Sparkles } from 'lucide-react'

type suggestedControlFormValues = {
  suggestedControlIDs?: string[]
  categories?: string[]
}

export default function SuggestedControlsStep({ frameworkName }: { frameworkName?: string }) {
  const { control, setValue } = useFormContext<suggestedControlFormValues>()
  const [expandedDomains, setExpandedDomains] = useState<string[]>([])
  const initializedSelectionRef = useRef(false)
  const { allControls, isLoading } = useAllControlsGroupedWithListFields({
    where: {
      refCodeHasPrefix: 'OL-',
      systemOwned: true,
    },
  })

  const suggestedControls = useMemo(() => allControls.filter((control) => control.refCode.startsWith('OL-')), [allControls])

  const groupedSuggestedControls = useMemo(
    () =>
      suggestedControls.reduce<Record<string, typeof suggestedControls>>((groups, control) => {
        const category = control.category ?? 'Uncategorized'
        if (!groups[category]) groups[category] = []
        groups[category].push(control)
        groups[category].sort((a, b) => a.refCode.localeCompare(b.refCode, undefined, { numeric: true }))

        return groups
      }, {}),
    [suggestedControls],
  )

  const categories = useMemo(() => Object.keys(groupedSuggestedControls).sort((a, b) => a.localeCompare(b)), [groupedSuggestedControls])

  const allControlIDs = useMemo(() => suggestedControls.map((control) => control.id), [suggestedControls])

  const selectedControlIDs = useWatch({ control, name: 'suggestedControlIDs' }) ?? []

  const allSelected = allControlIDs.length > 0 && selectedControlIDs.length === allControlIDs.length

  const setSelectedControls = useCallback(
    (controlIDs: string[]) => {
      const selectedCategories = [
        ...new Set(
          suggestedControls
            .filter((control) => controlIDs.includes(control.id))
            .map((control) => control.category)
            .filter((category): category is string => !!category),
        ),
      ]

      setValue('suggestedControlIDs', controlIDs, { shouldDirty: true, shouldValidate: true })
      setValue('categories', selectedCategories, { shouldDirty: true, shouldValidate: true })
    },
    [setValue, suggestedControls],
  )

  useEffect(() => {
    if (!initializedSelectionRef.current && allControlIDs.length > 0) {
      setSelectedControls(allControlIDs)
      initializedSelectionRef.current = true
    }
  }, [allControlIDs, setSelectedControls])

  const toggleControl = (controlID: string) => {
    const nextSelected = selectedControlIDs.includes(controlID) ? selectedControlIDs.filter((id) => id !== controlID) : [...selectedControlIDs, controlID]
    setSelectedControls(nextSelected)
  }

  const toggleDomain = (controlIDs: string[]) => {
    const domainSelected = controlIDs.every((id) => selectedControlIDs.includes(id))
    const nextSelected = domainSelected ? selectedControlIDs.filter((id) => !controlIDs.includes(id)) : [...new Set([...selectedControlIDs, ...controlIDs])]
    setSelectedControls(nextSelected)
  }

  const toggleAllOptions = () => {
    setSelectedControls(allSelected ? [] : allControlIDs)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold">Import Suggested Controls</h2>
          {frameworkName && <Badge variant="outline">{frameworkName}</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">We&apos;ve identified Openlane controls associated with {frameworkName || 'your selected framework'} to help you get started faster.</p>
      </div>

      <div className="flex gap-4 rounded-md border border-brand/30 bg-brand/5 p-4">
        <Sparkles className="mt-1 text-brand" size={24} />
        <div className="space-y-2">
          <p className="font-semibold">Save time getting started</p>
          <p className="text-sm text-muted-foreground">We will include all matching Openlane controls and their categories by default.</p>
          <p className="text-sm text-muted-foreground">You can review or deselect any controls you don't need.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <CheckCircle2 size={18} className="text-brand" />
        <span>Includes controls with an OL- reference code for the selected framework</span>
        <span>·</span>
        <span>You can deselect any control you don't need</span>
      </div>

      <div className="rounded-md border">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <p className="font-semibold">Suggested controls by domain</p>
            <p className="text-sm text-muted-foreground">{isLoading ? 'Loading controls...' : `${selectedControlIDs.length} of ${allControlIDs.length} controls selected`}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" onClick={toggleAllOptions} disabled={isLoading || allControlIDs.length === 0}>
              {allSelected ? 'Deselect all' : 'Import all now'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setExpandedDomains(expandedDomains.length ? [] : categories)}>
              {expandedDomains.length ? 'Collapse all' : 'Expand all'}
            </Button>
          </div>
        </div>

        <Accordion type="multiple" value={expandedDomains} onValueChange={setExpandedDomains}>
          {categories.map((category) => {
            const controls = groupedSuggestedControls[category] ?? []
            const controlIDs = controls.map((control) => control.id)
            const domainSelected = controlIDs.length > 0 && controlIDs.every((id) => selectedControlIDs.includes(id))

            return (
              <AccordionItem key={category} value={category} className="border-b last:border-b-0">
                <div className="flex items-center gap-3 p-4">
                  <Checkbox checked={domainSelected} onCheckedChange={() => toggleDomain(controlIDs)} disabled={isLoading || controlIDs.length === 0} />
                  <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-secondary">
                    <ShieldCheck size={22} className="text-brand" />
                  </div>
                  <AccordionTrigger className="flex flex-1 items-center justify-between bg-transparent text-left">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{category}</p>
                        <Badge variant="outline" className="border-brand/30 bg-brand/15 text-brand">
                          {controls.length} controls
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">Controls returned for the {category} category.</p>
                    </div>
                    {expandedDomains.includes(category) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </AccordionTrigger>
                </div>
                <AccordionContent>
                  <div className="space-y-2 border-t px-4 py-3">
                    {controls.map((control) => (
                      <label key={control.id} className="flex cursor-pointer items-start gap-3 rounded-md border bg-background p-3">
                        <Checkbox checked={selectedControlIDs.includes(control.id)} onCheckedChange={() => toggleControl(control.id)} className="mt-0.5" />
                        <span>
                          <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                            <Badge variant="outline" className="border-brand/30 bg-brand/10 text-brand">
                              {frameworkName} {control.refCode}
                            </Badge>
                            <span>{control.title}</span>
                          </span>
                          {control.description && <span className="block text-xs text-muted-foreground">{control.description}</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </div>

      <div className="flex items-center justify-between rounded-md border bg-secondary p-4 text-sm">
        <div className="flex items-start gap-3">
          <Info size={18} className="mt-0.5 text-muted-foreground" />
          <div>
            <p>Controls and categories are loaded from the selected framework.</p>
            <p className="text-muted-foreground">You can customize mappings or add additional controls after import.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
