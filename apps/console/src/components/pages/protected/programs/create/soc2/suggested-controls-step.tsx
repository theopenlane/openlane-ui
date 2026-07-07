'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { useAllControlsGrouped } from '@/lib/graphql-hooks/control'
import { useGetAllMappedControlsGrouped } from '@/lib/graphql-hooks/mapped-control'
import { ChevronDown, ChevronRight, ShieldCheck } from 'lucide-react'
import ControlChip from '@/components/pages/protected/controls/map-controls/shared/control-chip'
import { type MapControl } from '@/types'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Switch } from '@repo/ui/switch'
import { type SuggestedControlMappingGroup } from '@/lib/graphql-hooks/suggested-control-mappings'

type suggestedControlFormValues = {
  suggestedControlIDs?: string[]
  suggestedControlCategories?: string[]
  suggestedControlMappings?: SuggestedControlMappingGroup[]
  categories?: string[]
}

const emptySelection: string[] = []

export default function SuggestedControlsStep({ frameworkName }: { frameworkName?: string }) {
  const { control, setValue } = useFormContext<suggestedControlFormValues>()
  const [expandedDomains, setExpandedDomains] = useState<string[]>([])
  const [showOnlySelected, setShowOnlySelected] = useState(false)
  const initializedSelectionRef = useRef(false)
  const { allControls, isLoading } = useAllControlsGrouped({
    where: {
      refCodeHasPrefix: 'OL-',
      systemOwned: true,
    },
  })

  const trustServiceCategories = useWatch({ control, name: 'categories' }) ?? emptySelection

  const selectedControlIDs = useWatch({ control, name: 'suggestedControlIDs' }) ?? emptySelection
  const selectedControlCategories = useWatch({ control, name: 'suggestedControlCategories' }) ?? emptySelection

  const [groupBy, setGroupBy] = useState<'openlane' | 'mapped'>('openlane')

  const suggestedControls = useMemo(() => allControls.filter((control) => control.refCode.startsWith('OL-')), [allControls])

  const allControlIDs = useMemo(() => suggestedControls.map((control) => control.id), [suggestedControls])

  const olControlIDSet = useMemo(() => new Set(allControlIDs), [allControlIDs])

  const { mappedControlEdges, isLoading: isMappingsLoading } = useGetAllMappedControlsGrouped({
    where: {
      or: [{ hasFromControlsWith: [{ idIn: allControlIDs }] }, { hasToControlsWith: [{ idIn: allControlIDs }] }],
    },
    enabled: allControlIDs.length > 0,
  })

  // maps each suggested OL control id to the other controls (e.g. SOC2 controls) it's mapped to
  const mappedControlsByControlID = useMemo(() => {
    const result = new Map<string, MapControl[]>()
    const edges = mappedControlEdges

    for (const edge of edges) {
      const node = edge?.node
      if (!node) continue

      const fromNodes = node.fromControls?.edges?.map((e) => e?.node).filter((n): n is NonNullable<typeof n> => !!n) ?? []
      const toNodes = node.toControls?.edges?.map((e) => e?.node).filter((n): n is NonNullable<typeof n> => !!n) ?? []
      const allNodes = [...fromNodes, ...toNodes]

      const olNodes = allNodes.filter((n) => olControlIDSet.has(n.id))
      const otherNodes = allNodes.filter((n) => !olControlIDSet.has(n.id) && (!frameworkName || n.referenceFramework === frameworkName))

      if (olNodes.length === 0 || otherNodes.length === 0) continue

      for (const olNode of olNodes) {
        const existing = result.get(olNode.id) ?? []
        const existingRefCodes = new Set(existing.map((n) => n.refCode))
        const additions = otherNodes.filter((n) => !existingRefCodes.has(n.refCode))
        result.set(olNode.id, [
          ...existing,
          ...additions.map((n) => ({ __typename: 'Control' as const, id: n.id, refCode: n.refCode, category: n.category, subcategory: n.subcategory, referenceFramework: n.referenceFramework })),
        ])
      }
    }

    return result
  }, [mappedControlEdges, olControlIDSet, frameworkName])

  // raw system-seeded mapping groups (fromControls <-> toControls) touching any suggested OL control,
  // carried through the form so they can be recreated as org-scoped mappings once the controls are cloned
  const suggestedControlMappingGroups = useMemo(() => {
    const groups: SuggestedControlMappingGroup[] = []

    for (const edge of mappedControlEdges) {
      const node = edge?.node
      if (!node) continue

      const fromRefCodes = node.fromControls?.edges?.map((e) => e?.node?.refCode).filter((refCode): refCode is string => !!refCode) ?? []
      const toRefCodes = node.toControls?.edges?.map((e) => e?.node?.refCode).filter((refCode): refCode is string => !!refCode) ?? []

      if (fromRefCodes.length === 0 || toRefCodes.length === 0) continue

      groups.push({ fromRefCodes, toRefCodes, mappingType: node.mappingType, confidence: node.confidence, relation: node.relation })
    }

    return groups
  }, [mappedControlEdges])

  useEffect(() => {
    setValue('suggestedControlMappings', suggestedControlMappingGroups)
  }, [suggestedControlMappingGroups, setValue])

  const groupedByOpenlaneCategory = useMemo(
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

  const groupedByMappedCategory = useMemo(
    () =>
      suggestedControls.reduce<Record<string, typeof suggestedControls>>((groups, control) => {
        const mappedCategories = [...new Set((mappedControlsByControlID.get(control.id) ?? []).map((mapped) => mapped.category).filter((c): c is string => !!c))]
        const categoriesForControl = mappedCategories.length > 0 ? mappedCategories : ['Unmapped']

        for (const category of categoriesForControl) {
          if (!groups[category]) groups[category] = []
          groups[category].push(control)
          groups[category].sort((a, b) => a.refCode.localeCompare(b.refCode, undefined, { numeric: true }))
        }

        return groups
      }, {}),
    [suggestedControls, mappedControlsByControlID],
  )

  const groupedSuggestedControls = groupBy === 'openlane' ? groupedByOpenlaneCategory : groupedByMappedCategory

  const categories = useMemo(() => Object.keys(groupedSuggestedControls).sort((a, b) => a.localeCompare(b)), [groupedSuggestedControls])

  const suggestedDefaultControlIDs = useMemo(
    () => allControlIDs.filter((id) => (mappedControlsByControlID.get(id) ?? []).some((mapped) => mapped.category && trustServiceCategories.includes(mapped.category))),
    [allControlIDs, mappedControlsByControlID, trustServiceCategories],
  )

  const selectedControlSet = useMemo(() => new Set(selectedControlIDs), [selectedControlIDs])

  const allSelected = allControlIDs.length > 0 && allControlIDs.every((id) => selectedControlSet.has(id))

  const applyControlSelection = useCallback(
    (nextControlIDs: string[]) => {
      const nextSet = new Set(nextControlIDs)
      const nextCategories = categories.filter((category) => {
        const controls = groupedSuggestedControls[category] ?? []
        return controls.length > 0 && controls.every((control) => nextSet.has(control.id))
      })
      setValue('suggestedControlIDs', nextControlIDs, { shouldDirty: true, shouldValidate: true })
      setValue('suggestedControlCategories', nextCategories, { shouldDirty: true, shouldValidate: true })
    },
    [categories, groupedSuggestedControls, setValue],
  )

  useEffect(() => {
    if (!initializedSelectionRef.current && categories.length > 0 && suggestedControls.length > 0 && !isMappingsLoading) {
      applyControlSelection(suggestedDefaultControlIDs)
      initializedSelectionRef.current = true
    }
  }, [applyControlSelection, categories.length, isMappingsLoading, suggestedControls.length, suggestedDefaultControlIDs])

  const toggleControl = (controlId: string) => {
    const nextControlIDs = selectedControlSet.has(controlId) ? selectedControlIDs.filter((id) => id !== controlId) : [...selectedControlIDs, controlId]
    applyControlSelection(nextControlIDs)
  }

  const toggleDomain = (domainName: string) => {
    const controlIDsForDomain = (groupedSuggestedControls[domainName] ?? []).map((control) => control.id)
    const domainFullySelected = controlIDsForDomain.length > 0 && controlIDsForDomain.every((id) => selectedControlSet.has(id))
    const nextControlIDs = domainFullySelected ? selectedControlIDs.filter((id) => !controlIDsForDomain.includes(id)) : [...new Set([...selectedControlIDs, ...controlIDsForDomain])]
    applyControlSelection(nextControlIDs)
  }

  const toggleAllOptions = () => {
    applyControlSelection(allSelected ? [] : allControlIDs)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold">Import Template Controls</h2>
          {frameworkName && <Badge variant="outline">{frameworkName}</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">
          Template controls are provided as a starting point to get your organization started on your first audit. When created, they will be imported as template controls in a <b>DRAFT</b> state and
          require you to review and update placeholders.
        </p>
      </div>

      <div className="rounded-md border">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <p className="font-semibold">{groupBy === 'openlane' ? 'Suggested controls by control category' : `Suggested template controls by ${frameworkName || 'SOC 2'} pillar`}</p>
            <p className="text-sm text-muted-foreground">
              {isLoading ? 'Loading controls...' : `${selectedControlCategories.length} of ${categories.length} categories selected, ${selectedControlIDs.length} controls ready to import`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-xs font-medium text-muted-foreground">Show only selected</span>
            <Switch checked={showOnlySelected} onCheckedChange={setShowOnlySelected} />
            <span className="shrink-0 text-xs font-medium text-muted-foreground">Group categories by:</span>
            <Tabs value={groupBy} onValueChange={(value) => setGroupBy(value as 'openlane' | 'mapped')} variant="solid" className="shrink-0">
              <TabsList className="w-auto">
                <TabsTrigger value="openlane" className="whitespace-nowrap px-3">
                  Openlane
                </TabsTrigger>
                <TabsTrigger value="mapped" className="whitespace-nowrap px-3">
                  {frameworkName || 'SOC 2'}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button type="button" variant="secondary" onClick={toggleAllOptions} disabled={isLoading || allControlIDs.length === 0}>
              {allSelected ? 'Deselect all' : 'Select all categories'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setExpandedDomains(expandedDomains.length ? [] : categories)} disabled={isLoading || categories.length === 0}>
              {expandedDomains.length ? 'Collapse all' : 'Expand all'}
            </Button>
          </div>
        </div>

        <Accordion type="multiple" value={expandedDomains} onValueChange={setExpandedDomains}>
          {categories.map((category) => {
            const controls = groupedSuggestedControls[category] ?? []
            const visibleControls = showOnlySelected ? controls.filter((control) => selectedControlSet.has(control.id)) : controls

            if (visibleControls.length === 0) return null

            const selectedCount = controls.filter((control) => selectedControlSet.has(control.id)).length
            const domainStatus = selectedCount === 0 ? 'none' : selectedCount === controls.length ? 'all' : 'partial'

            return (
              <AccordionItem key={category} value={category} className="border-b last:border-b-0">
                <div className="flex items-center gap-3 p-4">
                  <Checkbox
                    checked={domainStatus === 'all' ? true : domainStatus === 'partial' ? 'indeterminate' : false}
                    onCheckedChange={() => toggleDomain(category)}
                    disabled={isLoading || controls.length === 0}
                  />
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
                      <p className="mt-1 text-sm text-muted-foreground">
                        {domainStatus === 'all'
                          ? `All controls in ${category} will be imported`
                          : domainStatus === 'partial'
                            ? `${selectedCount} of ${controls.length} controls in ${category} will be imported`
                            : `Select ${category} to import these controls`}
                      </p>
                    </div>
                    {expandedDomains.includes(category) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </AccordionTrigger>
                </div>
                <AccordionContent>
                  <div className="space-y-2 border-t px-4 py-3">
                    {visibleControls.map((control) => {
                      const mappedControls = (mappedControlsByControlID.get(control.id) ?? []).slice(0, 3)
                      const controlSelected = selectedControlSet.has(control.id)

                      return (
                        <div key={control.id} className="flex items-start gap-3 rounded-md border bg-background p-3">
                          <Checkbox checked={controlSelected} onCheckedChange={() => toggleControl(control.id)} disabled={isLoading} />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium">{control.title}</span>
                            {control.description && <span className="block text-xs text-muted-foreground">{control.description}</span>}
                            {mappedControls.length > 0 && (
                              <span className="mt-2 flex flex-wrap items-center gap-1">
                                <span className="text-xs font-normal text-muted-foreground">Maps to:</span>
                                {mappedControls.map((mapped) => (
                                  <ControlChip key={mapped.id} control={mapped} clickable={false} disableHref />
                                ))}
                              </span>
                            )}
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
