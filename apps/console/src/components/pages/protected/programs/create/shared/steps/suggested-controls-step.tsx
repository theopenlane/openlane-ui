'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Switch } from '@repo/ui/switch'
import { AlertCircle, ChevronDown, ChevronRight, PackageOpen, ShieldCheck } from 'lucide-react'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { useAllControlsGrouped } from '@/lib/graphql-hooks/control'
import { useGetAllMappedControlsGrouped } from '@/lib/graphql-hooks/mapped-control'
import { type MappedControlWhereInput } from '@repo/codegen/src/schema'
import { type MapControl } from '@/types'
import { type SuggestedControlMappingGroup } from '../suggested-controls-schema'
import SuggestedControlRow from './suggested-control-row'

type SuggestedControlFormValues = {
  suggestedControlIDs?: string[]
  suggestedControlCategories?: string[]
  suggestedControlMappings?: SuggestedControlMappingGroup[]
  suggestedControlsInitialized?: boolean
}

const TEMPLATE_CONTROL_REF_CODE_PREFIX = 'OL-'
const MAPPED_CONTROLS_PAGE_SIZE = 100
const MAPPED_CONTROLS_MAX_PAGES = 20
const UNCATEGORIZED = 'Uncategorized'
const UNMAPPED = 'Unmapped'

type GroupBy = 'openlane' | 'mapped'
const toGroupBy = (value: string): GroupBy => (value === 'mapped' ? 'mapped' : 'openlane')

const emptySelection: string[] = []

const SuggestedControlsStep = ({ frameworkName }: { frameworkName?: string }) => {
  const { control, setValue } = useFormContext<SuggestedControlFormValues>()
  const [expandedDomains, setExpandedDomains] = useState<string[]>([])
  const [showOnlySelected, setShowOnlySelected] = useState(false)
  const [groupBy, setGroupBy] = useState<GroupBy>('openlane')

  const {
    allControls: suggestedControls,
    isLoading: isControlsLoading,
    isError: isControlsError,
  } = useAllControlsGrouped({
    where: {
      refCodeHasPrefix: TEMPLATE_CONTROL_REF_CODE_PREFIX,
      systemOwned: true,
    },
  })

  const selectedControlIDs = useWatch({ control, name: 'suggestedControlIDs' }) ?? emptySelection
  const selectedControlCategories = useWatch({ control, name: 'suggestedControlCategories' }) ?? emptySelection
  const hasInitializedSelection = useWatch({ control, name: 'suggestedControlsInitialized' }) ?? false

  const allControlIDs = useMemo(() => suggestedControls.map((suggestedControl) => suggestedControl.id), [suggestedControls])
  const olControlIDSet = useMemo(() => new Set(allControlIDs), [allControlIDs])

  const mappedControlsWhere = useMemo<MappedControlWhereInput | undefined>(() => {
    if (allControlIDs.length === 0) return undefined

    const templateSide = [{ idIn: allControlIDs }]
    const frameworkSide = frameworkName ? [{ referenceFramework: frameworkName }] : undefined

    return {
      or: [
        { and: [{ hasFromControlsWith: templateSide }, ...(frameworkSide ? [{ hasToControlsWith: frameworkSide }] : [])] },
        { and: [{ hasToControlsWith: templateSide }, ...(frameworkSide ? [{ hasFromControlsWith: frameworkSide }] : [])] },
      ],
    }
  }, [allControlIDs, frameworkName])

  const {
    mappedControlEdges,
    isLoading: isMappingsLoading,
    isError: isMappingsError,
    isTruncated: isMappingsTruncated,
  } = useGetAllMappedControlsGrouped({
    where: mappedControlsWhere,
    enabled: allControlIDs.length > 0,
    pageSize: MAPPED_CONTROLS_PAGE_SIZE,
    maxPages: MAPPED_CONTROLS_MAX_PAGES,
  })

  const mappedControlsByControlID = useMemo(() => {
    const result = new Map<string, MapControl[]>()

    for (const edge of mappedControlEdges) {
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

  const groupedByOpenlaneCategory = useMemo(
    () =>
      suggestedControls.reduce<Record<string, typeof suggestedControls>>((groups, suggestedControl) => {
        const category = suggestedControl.category ?? UNCATEGORIZED
        if (!groups[category]) groups[category] = []
        groups[category].push(suggestedControl)
        groups[category].sort((a, b) => a.refCode.localeCompare(b.refCode, undefined, { numeric: true }))

        return groups
      }, {}),
    [suggestedControls],
  )

  const groupedByMappedCategory = useMemo(
    () =>
      suggestedControls.reduce<Record<string, typeof suggestedControls>>((groups, suggestedControl) => {
        const mappedCategories = [...new Set((mappedControlsByControlID.get(suggestedControl.id) ?? []).map((mapped) => mapped.category).filter((c): c is string => !!c))]
        const categoriesForControl = mappedCategories.length > 0 ? mappedCategories : [UNMAPPED]

        for (const category of categoriesForControl) {
          if (!groups[category]) groups[category] = []
          groups[category].push(suggestedControl)
          groups[category].sort((a, b) => a.refCode.localeCompare(b.refCode, undefined, { numeric: true }))
        }

        return groups
      }, {}),
    [suggestedControls, mappedControlsByControlID],
  )

  const groupedSuggestedControls = groupBy === 'openlane' ? groupedByOpenlaneCategory : groupedByMappedCategory

  const categories = useMemo(() => Object.keys(groupedSuggestedControls).sort((a, b) => a.localeCompare(b)), [groupedSuggestedControls])

  const selectedControlSet = useMemo(() => new Set(selectedControlIDs), [selectedControlIDs])

  const selectedRefCodes = useMemo(
    () => new Set(suggestedControls.filter((suggestedControl) => selectedControlSet.has(suggestedControl.id)).map((suggestedControl) => suggestedControl.refCode)),
    [suggestedControls, selectedControlSet],
  )

  const suggestedControlMappingGroups = useMemo(() => {
    const groups: SuggestedControlMappingGroup[] = []

    for (const edge of mappedControlEdges) {
      const node = edge?.node
      if (!node) continue

      const fromRefCodes = node.fromControls?.edges?.map((e) => e?.node?.refCode).filter((refCode): refCode is string => !!refCode) ?? []
      const toRefCodes = node.toControls?.edges?.map((e) => e?.node?.refCode).filter((refCode): refCode is string => !!refCode) ?? []

      if (fromRefCodes.length === 0 || toRefCodes.length === 0) continue
      if (![...fromRefCodes, ...toRefCodes].some((refCode) => selectedRefCodes.has(refCode))) continue

      groups.push({ fromRefCodes, toRefCodes, mappingType: node.mappingType, confidence: node.confidence, relation: node.relation })
    }

    return groups
  }, [mappedControlEdges, selectedRefCodes])

  useEffect(() => {
    setValue('suggestedControlMappings', suggestedControlMappingGroups)
  }, [suggestedControlMappingGroups, setValue])

  const allSelected = allControlIDs.length > 0 && allControlIDs.every((id) => selectedControlSet.has(id))

  const applyControlSelection = useCallback(
    (nextControlIDs: string[]) => {
      const nextSet = new Set(nextControlIDs)
      const nextCategories = categories.filter((category) => {
        const controls = groupedSuggestedControls[category] ?? []
        return controls.length > 0 && controls.every((groupedControl) => nextSet.has(groupedControl.id))
      })
      setValue('suggestedControlIDs', nextControlIDs, { shouldDirty: true, shouldValidate: true })
      setValue('suggestedControlCategories', nextCategories, { shouldDirty: true, shouldValidate: true })
    },
    [categories, groupedSuggestedControls, setValue],
  )

  useEffect(() => {
    if (hasInitializedSelection || isControlsLoading || isMappingsLoading || allControlIDs.length === 0) return

    applyControlSelection(allControlIDs)
    setValue('suggestedControlsInitialized', true)
  }, [allControlIDs, applyControlSelection, hasInitializedSelection, isControlsLoading, isMappingsLoading, setValue])

  const toggleControl = (controlId: string) => {
    const nextControlIDs = selectedControlSet.has(controlId) ? selectedControlIDs.filter((id) => id !== controlId) : [...selectedControlIDs, controlId]
    applyControlSelection(nextControlIDs)
  }

  const toggleDomain = (domainName: string) => {
    const controlIDsForDomain = (groupedSuggestedControls[domainName] ?? []).map((groupedControl) => groupedControl.id)
    const domainFullySelected = controlIDsForDomain.length > 0 && controlIDsForDomain.every((id) => selectedControlSet.has(id))
    const nextControlIDs = domainFullySelected ? selectedControlIDs.filter((id) => !controlIDsForDomain.includes(id)) : [...new Set([...selectedControlIDs, ...controlIDsForDomain])]
    applyControlSelection(nextControlIDs)
  }

  const toggleAllOptions = () => {
    applyControlSelection(allSelected ? [] : allControlIDs)
  }

  const isLoading = isControlsLoading || isMappingsLoading
  const isError = isControlsError || isMappingsError
  const isEmpty = !isLoading && !isError && allControlIDs.length === 0

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

      {isError ? (
        <div className="flex flex-col items-center gap-2 rounded-md border p-10 text-center">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <p className="font-semibold">We couldn&apos;t load template controls</p>
          <p className="max-w-md text-sm text-muted-foreground">Something went wrong while fetching the template control library. Go back and try again, or continue without importing controls.</p>
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center gap-2 rounded-md border p-10 text-center">
          <PackageOpen className="h-6 w-6 text-muted-foreground" />
          <p className="font-semibold">No template controls are available</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Your organization doesn&apos;t have a template control library yet, so there is nothing to import. You can continue and add controls to the program later.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <p className="font-semibold">{groupBy === 'openlane' ? 'Suggested controls by control category' : `Suggested template controls by ${frameworkName || 'framework'} pillar`}</p>
              <p className="text-sm text-muted-foreground">
                {isLoading ? 'Loading controls...' : `${selectedControlCategories.length} of ${categories.length} categories selected, ${selectedControlIDs.length} controls ready to import`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-xs font-medium text-muted-foreground">Show only selected</span>
              <Switch checked={showOnlySelected} onCheckedChange={setShowOnlySelected} />
              <span className="shrink-0 text-xs font-medium text-muted-foreground">Group categories by:</span>
              <Tabs value={groupBy} onValueChange={(value) => setGroupBy(toGroupBy(value))} variant="solid" className="shrink-0">
                <TabsList className="w-auto">
                  <TabsTrigger value="openlane" className="whitespace-nowrap px-3">
                    Openlane
                  </TabsTrigger>
                  <TabsTrigger value="mapped" className="whitespace-nowrap px-3">
                    {frameworkName || 'Framework'}
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

          {isMappingsTruncated && (
            <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2 text-sm text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <p>Showing the first {MAPPED_CONTROLS_PAGE_SIZE * MAPPED_CONTROLS_MAX_PAGES} control mappings. Some framework mappings may not be listed.</p>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Skeleton height={20} width={20} />
                  <Skeleton height={48} width={48} />
                  <div className="flex-1 space-y-2">
                    <Skeleton height={14} width="30%" />
                    <Skeleton height={12} width="60%" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Accordion type="multiple" value={expandedDomains} onValueChange={setExpandedDomains}>
              {categories.map((category) => {
                const controls = groupedSuggestedControls[category] ?? []
                const visibleControls = showOnlySelected ? controls.filter((groupedControl) => selectedControlSet.has(groupedControl.id)) : controls

                if (visibleControls.length === 0) return null

                const selectedCount = controls.filter((groupedControl) => selectedControlSet.has(groupedControl.id)).length
                const domainStatus = selectedCount === 0 ? 'none' : selectedCount === controls.length ? 'all' : 'partial'

                return (
                  <AccordionItem key={category} value={category} className="border-b last:border-b-0">
                    <div className="flex items-center gap-3 p-4">
                      <Checkbox
                        checked={domainStatus === 'all' ? true : domainStatus === 'partial' ? 'indeterminate' : false}
                        onCheckedChange={() => toggleDomain(category)}
                        disabled={controls.length === 0}
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
                        {visibleControls.map((visibleControl) => (
                          <SuggestedControlRow
                            key={visibleControl.id}
                            title={visibleControl.title}
                            description={visibleControl.description}
                            mappedControls={(mappedControlsByControlID.get(visibleControl.id) ?? []).slice(0, 3)}
                            checked={selectedControlSet.has(visibleControl.id)}
                            onToggle={() => toggleControl(visibleControl.id)}
                          />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          )}
        </div>
      )}
    </div>
  )
}

export default SuggestedControlsStep
