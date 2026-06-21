'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { useAllControlsGroupedWithListFields } from '@/lib/graphql-hooks/control'
import { CheckCircle2, ChevronDown, ChevronRight, Info, ShieldCheck, Sparkles, Timer } from 'lucide-react'

export const SOC2_SUGGESTED_CONTROL_CATEGORIES = ['Security', 'Availability'] as const

type suggestedControlFormValues = {
  suggestedControlIDs?: string[]
}

const categoryDetails: Record<string, { description: string; icon: React.ReactNode; badgeClassName: string }> = {
  Security: {
    description: 'Controls to protect information and systems against unauthorized access, disclosure, and other security incidents.',
    icon: <ShieldCheck size={22} className="text-brand" />,
    badgeClassName: 'bg-brand/15 text-brand border-brand/30',
  },
  Availability: {
    description: 'Controls to ensure systems and data are available for operation and use as committed or agreed.',
    icon: <Timer size={22} className="text-blue-500" />,
    badgeClassName: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  },
}

export default function SuggestedControlsStep({ standardID }: { standardID?: string }) {
  const { setValue, watch } = useFormContext<suggestedControlFormValues>()
  const [expandedDomains, setExpandedDomains] = useState<string[]>([])
  const initializedSelectionRef = useRef(false)
  const { allControls, isLoading } = useAllControlsGroupedWithListFields({
    where: {
      categoryIn: [...SOC2_SUGGESTED_CONTROL_CATEGORIES],
      referenceFramework: 'SOC 2',
      systemOwned: true,
      ...(standardID ? { hasStandardWith: [{ id: standardID }] } : {}),
    },
  })

  const suggestedControls = useMemo(
    () => allControls.filter((control) => SOC2_SUGGESTED_CONTROL_CATEGORIES.includes(control.category as (typeof SOC2_SUGGESTED_CONTROL_CATEGORIES)[number])),
    [allControls],
  )

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

  const allControlIDs = useMemo(() => suggestedControls.map((control) => control.id), [suggestedControls])

  const selectedControlIDs = watch('suggestedControlIDs') ?? []

  const allSelected = allControlIDs.length > 0 && selectedControlIDs.length === allControlIDs.length

  useEffect(() => {
    if (!initializedSelectionRef.current && allControlIDs.length > 0) {
      setValue('suggestedControlIDs', allControlIDs, { shouldDirty: true, shouldValidate: true })
      initializedSelectionRef.current = true
    }
  }, [allControlIDs, setValue])

  const toggleControl = (controlID: string) => {
    const nextSelected = selectedControlIDs.includes(controlID) ? selectedControlIDs.filter((id) => id !== controlID) : [...selectedControlIDs, controlID]
    setValue('suggestedControlIDs', nextSelected, { shouldDirty: true, shouldValidate: true })
  }

  const toggleDomain = (controlIDs: string[]) => {
    const domainSelected = controlIDs.every((id) => selectedControlIDs.includes(id))
    const nextSelected = domainSelected ? selectedControlIDs.filter((id) => !controlIDs.includes(id)) : [...new Set([...selectedControlIDs, ...controlIDs])]
    setValue('suggestedControlIDs', nextSelected, { shouldDirty: true, shouldValidate: true })
  }

  const toggleAllOptions = () => {
    setValue('suggestedControlIDs', allSelected ? [] : allControlIDs, { shouldDirty: true, shouldValidate: true })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold">Import Suggested Controls</h2>
          <Badge variant="outline">SOC 2</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          We&apos;ve identified controls recommended for a SOC 2 program based on Security and Availability. These are Openlane's suggested controls to help you get started faster.
        </p>
      </div>

      <div className="flex gap-4 rounded-md border border-brand/30 bg-brand/5 p-4">
        <Sparkles className="mt-1 text-brand" size={24} />
        <div className="space-y-2">
          <p className="font-semibold">Save time getting started</p>
          <p className="text-sm text-muted-foreground">We will include all recommended controls for Security and Availability by default.</p>
          <p className="text-sm text-muted-foreground">You can review or deselect any controls you don't need.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <CheckCircle2 size={18} className="text-brand" />
        <span>Includes all recommended controls for Security and Availability domains</span>
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
            <Button type="button" variant="secondary" onClick={() => setExpandedDomains(expandedDomains.length ? [] : [...SOC2_SUGGESTED_CONTROL_CATEGORIES])}>
              {expandedDomains.length ? 'Collapse all' : 'Expand all'}
            </Button>
          </div>
        </div>

        <Accordion type="multiple" value={expandedDomains} onValueChange={setExpandedDomains}>
          {SOC2_SUGGESTED_CONTROL_CATEGORIES.map((category) => {
            const controls = groupedSuggestedControls[category] ?? []
            const controlIDs = controls.map((control) => control.id)
            const details = categoryDetails[category]
            const domainSelected = controlIDs.length > 0 && controlIDs.every((id) => selectedControlIDs.includes(id))

            return (
              <AccordionItem key={category} value={category} className="border-b last:border-b-0">
                <div className="flex items-center gap-3 p-4">
                  <Checkbox checked={domainSelected} onCheckedChange={() => toggleDomain(controlIDs)} disabled={isLoading || controlIDs.length === 0} />
                  <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-secondary">{details.icon}</div>
                  <AccordionTrigger className="flex flex-1 items-center justify-between bg-transparent text-left">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{category}</p>
                        <Badge variant="outline" className={details.badgeClassName}>
                          {controls.length} controls
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{details.description}</p>
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
                              SOC 2 {control.refCode}
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
            <p>Control mappings are based on the AICPA SOC 2 2017 Trust Services Criteria.</p>
            <p className="text-muted-foreground">You can customize mappings or add additional controls after import.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
