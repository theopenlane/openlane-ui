'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { useAllControlsGroupedWithListFields } from '@/lib/graphql-hooks/control'
import { CheckCircle2, ChevronDown, ChevronRight, ShieldCheck } from 'lucide-react'

type suggestedControlFormValues = {
  suggestedControlIDs?: string[]
  suggestedControlCategories?: string[]
  categories?: string[]
}

const emptySelection: string[] = []

const formatMappedCategories = (mappedCategories?: string[] | null) => {
  if (!mappedCategories?.length) return null

  return mappedCategories.slice(0, 3).join(', ')
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

  const selectedControlIDs = useWatch({ control, name: 'suggestedControlIDs' }) ?? emptySelection
  const selectedControlCategories = useWatch({ control, name: 'suggestedControlCategories' }) ?? emptySelection
  const selectedTrustServiceCategories = useWatch({ control, name: 'categories' }) ?? emptySelection
  const isSoc2 = frameworkName?.toLowerCase().includes('soc 2')

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

  const allControlIDs = useMemo(() => categories.flatMap((category) => groupedSuggestedControls[category]?.map((control) => control.id) ?? []), [categories, groupedSuggestedControls])

  const selectedCategorySet = useMemo(() => new Set(selectedControlCategories), [selectedControlCategories])

  const allSelected = categories.length > 0 && selectedControlCategories.length === categories.length

  const getControlIDsForDomains = useCallback(
    (domainNames: string[]) => {
      return [...new Set(domainNames.flatMap((domainName) => groupedSuggestedControls[domainName]?.map((control) => control.id) ?? []))]
    },
    [groupedSuggestedControls],
  )

  const setSelectedDomains = useCallback(
    (domainNames: string[]) => {
      setValue('suggestedControlIDs', getControlIDsForDomains(domainNames), { shouldDirty: true, shouldValidate: true })
      setValue('suggestedControlCategories', domainNames, { shouldDirty: true, shouldValidate: true })
    },
    [getControlIDsForDomains, setValue],
  )

  useEffect(() => {
    if (!initializedSelectionRef.current && categories.length > 0 && suggestedControls.length > 0) {
      setSelectedDomains(categories)
      initializedSelectionRef.current = true
    }
  }, [categories, setSelectedDomains, suggestedControls.length])

  const toggleDomain = (domainName: string) => {
    const nextSelected = selectedCategorySet.has(domainName) ? selectedControlCategories.filter((category) => category !== domainName) : [...selectedControlCategories, domainName]
    setSelectedDomains(nextSelected)
  }

  const toggleAllOptions = () => {
    setSelectedDomains(allSelected ? [] : categories)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold">Import Suggested Controls</h2>
          {frameworkName && <Badge variant="outline">{frameworkName}</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">Select the Openlane control categories you want to import. We&apos;ll import the matching organization controls from the backend.</p>
      </div>

      <div className="rounded-md border border-brand/30 bg-brand/5 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">Start with the right controls</p>
          {isSoc2 &&
            selectedTrustServiceCategories.map((category) => (
              <Badge key={category} variant="outline">
                {category}
              </Badge>
            ))}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {isSoc2
            ? 'SOC 2 controls will be created for the selected Trust Service Categories. These Openlane organization controls are grouped by their own categories.'
            : 'Choose one or more categories, then continue to import the suggested controls for those categories.'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <CheckCircle2 size={18} className="text-brand" />
        <span>Selected Openlane categories determine which organization controls are imported</span>
      </div>

      <div className="rounded-md border">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <p className="font-semibold">Suggested controls by category</p>
            <p className="text-sm text-muted-foreground">
              {isLoading ? 'Loading controls...' : `${selectedControlCategories.length} of ${categories.length} categories selected, ${selectedControlIDs.length} controls ready to import`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" onClick={toggleAllOptions} disabled={isLoading || allControlIDs.length === 0}>
              {allSelected ? 'Deselect all' : 'Select all categories'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setExpandedDomains(expandedDomains.length ? [] : categories)} disabled={expandedDomains.length === 0 || isLoading}>
              {expandedDomains.length ? 'Collapse all' : 'Expand all'}
            </Button>
          </div>
        </div>

        <Accordion type="multiple" value={expandedDomains} onValueChange={setExpandedDomains}>
          {categories.map((category) => {
            const controls = groupedSuggestedControls[category] ?? []
            const domainSelected = selectedCategorySet.has(category)

            return (
              <AccordionItem key={category} value={category} className="border-b last:border-b-0">
                <div className="flex items-center gap-3 p-4 [&_[role=checkbox]]:border-slate-400 [&_[role=checkbox]]:bg-white [&_[role=checkbox]]:shadow-sm dark:[&_[role=checkbox]]:border-border dark:[&_[role=checkbox]]:bg-background [&_[role=checkbox][data-state=checked]]:border-brand [&_[role=checkbox][data-state=checked]]:bg-brand">
                  <Checkbox checked={domainSelected} onCheckedChange={() => toggleDomain(category)} disabled={isLoading || controls.length === 0} />
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
                      <p className="mt-1 text-sm text-muted-foreground">{domainSelected ? `Controls in ${category} will be imported.` : `Select ${category} to import these controls.`}</p>
                    </div>
                    {expandedDomains.includes(category) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </AccordionTrigger>
                </div>
                <AccordionContent>
                  <div className="space-y-2 border-t px-4 py-3">
                    {controls.map((control) => {
                      const mappedCategories = formatMappedCategories(control.mappedCategories)

                      return (
                        <div key={control.id} className="flex items-start gap-3 rounded-md border bg-background p-3">
                          <CheckCircle2 size={16} className={`mt-0.5 shrink-0 ${domainSelected ? 'text-brand' : 'text-muted-foreground'}`} />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-3 text-sm font-medium">
                              <span>{control.title}</span>
                              {mappedCategories && (
                                <Badge variant="outline" className="shrink-0 border-brand/30 bg-brand/10 text-brand">
                                  Maps to {mappedCategories}
                                </Badge>
                              )}
                            </span>
                            {control.description && <span className="block text-xs text-muted-foreground">{control.description}</span>}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </div>
    </div>
  )
}
