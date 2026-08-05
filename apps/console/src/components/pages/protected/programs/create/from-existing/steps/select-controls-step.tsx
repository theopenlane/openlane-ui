'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Switch } from '@repo/ui/switch'
import ControlChip from '@/components/pages/protected/controls/map-controls/shared/control-chip'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { ChevronDown, ChevronRight, PackageOpen } from 'lucide-react'
import { useDebounce } from '@uidotdev/usehooks'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { StandardsIconMapper } from '@/components/shared/standards-icon-mapper/standards-icon-mapper'
import { useAllControlsGroupedWithListFields } from '@/lib/graphql-hooks/control'
import { ControlControlStatus } from '@repo/codegen/src/schema'
import { groupControlsByFramework, type WizardValues } from '../from-existing-wizard-config'

const emptySelection: string[] = []

type SelectControlsStepProps = {
  sourceProgramName?: string | null
}

const SelectControlsStep = ({ sourceProgramName }: SelectControlsStepProps) => {
  const { control, setValue } = useFormContext<WizardValues>()
  const [expandedFrameworks, setExpandedFrameworks] = useState<string[]>([])
  const [showOnlySelected, setShowOnlySelected] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  const { allControls: orgControls, isLoading } = useAllControlsGroupedWithListFields({ where: { or: [{ systemOwned: false }, { systemOwnedIsNil: true }] } })

  const selectedControlIDs = useWatch({ control, name: 'controlIDs' }) ?? emptySelection
  const selectedControlSet = useMemo(() => new Set(selectedControlIDs), [selectedControlIDs])

  const groupedByFramework = useMemo(() => {
    const groups = groupControlsByFramework(orgControls)

    for (const controls of Object.values(groups)) {
      controls.sort((a, b) => a.refCode.localeCompare(b.refCode, undefined, { numeric: true }))
    }

    return groups
  }, [orgControls])

  const frameworks = useMemo(() => Object.keys(groupedByFramework).sort((a, b) => a.localeCompare(b)), [groupedByFramework])

  const applySelection = useCallback((nextControlIDs: string[]) => setValue('controlIDs', nextControlIDs, { shouldDirty: true, shouldValidate: true }), [setValue])

  const toggleControl = (controlID: string) => {
    applySelection(selectedControlSet.has(controlID) ? selectedControlIDs.filter((id) => id !== controlID) : [...selectedControlIDs, controlID])
  }

  const toggleFramework = (framework: string) => {
    const controlIDsForFramework = (groupedByFramework[framework] ?? []).map((frameworkControl) => frameworkControl.id)
    const frameworkControlSet = new Set(controlIDsForFramework)
    const fullySelected = controlIDsForFramework.length > 0 && controlIDsForFramework.every((id) => selectedControlSet.has(id))
    applySelection(fullySelected ? selectedControlIDs.filter((id) => !frameworkControlSet.has(id)) : [...new Set([...selectedControlIDs, ...controlIDsForFramework])])
  }

  const allControlIDs = useMemo(() => orgControls.map((orgControl) => orgControl.id), [orgControls])
  const allSelected = allControlIDs.length > 0 && allControlIDs.every((id) => selectedControlSet.has(id))

  const matchesSearch = useCallback(
    (searchable: (string | null | undefined)[]) => {
      if (!debouncedSearchQuery) return true
      const query = debouncedSearchQuery.toLowerCase()
      return searchable.some((value) => value?.toLowerCase().includes(query))
    },
    [debouncedSearchQuery],
  )

  const isEmpty = !isLoading && orgControls.length === 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Select controls</h2>
        <p className="text-sm text-muted-foreground">
          {sourceProgramName ? `Controls from ${sourceProgramName} are preselected.` : 'Controls from the copied program are preselected.'} Archived controls are left unchecked by default. Add or
          remove any control in your organization before creating the program.
        </p>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center gap-2 rounded-md border p-10 text-center">
          <PackageOpen className="h-6 w-6 text-muted-foreground" />
          <p className="font-semibold">No controls in your organization yet</p>
          <p className="max-w-md text-sm text-muted-foreground">You can create the program now and import controls later from the program settings.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <div className="flex items-center justify-between gap-4 border-b p-4">
            <div>
              <p className="font-semibold">Controls by framework</p>
              <p className="text-sm text-muted-foreground">{isLoading ? 'Loading controls...' : `${selectedControlIDs.length} of ${allControlIDs.length} controls selected`}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <Label htmlFor="control-search" className="sr-only">
                  Search
                </Label>
                <Input id="control-search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search controls..." className="h-9 w-[200px]" />
              </div>
              <span className="shrink-0 text-xs font-medium text-muted-foreground">Show only selected</span>
              <Switch checked={showOnlySelected} onCheckedChange={setShowOnlySelected} />
              <Button type="button" variant="secondary" onClick={() => applySelection(allSelected ? [] : allControlIDs)} disabled={isLoading || allControlIDs.length === 0}>
                {allSelected ? 'Deselect all' : 'Select all'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setExpandedFrameworks(expandedFrameworks.length ? [] : frameworks)} disabled={isLoading || frameworks.length === 0}>
                {expandedFrameworks.length ? 'Collapse all' : 'Expand all'}
              </Button>
            </div>
          </div>

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
            <Accordion type="multiple" value={expandedFrameworks} onValueChange={setExpandedFrameworks}>
              {frameworks.map((framework) => {
                const controls = groupedByFramework[framework] ?? []
                const visibleControls = controls.filter(
                  (frameworkControl) =>
                    (!showOnlySelected || selectedControlSet.has(frameworkControl.id)) && matchesSearch([frameworkControl.refCode, frameworkControl.title, frameworkControl.category]),
                )

                if (visibleControls.length === 0) return null

                const selectedCount = controls.filter((frameworkControl) => selectedControlSet.has(frameworkControl.id)).length
                const frameworkStatus = selectedCount === 0 ? 'none' : selectedCount === controls.length ? 'all' : 'partial'

                return (
                  <AccordionItem key={framework} value={framework} className="border-b last:border-b-0">
                    <div className="flex items-center gap-3 p-4">
                      <Checkbox checked={frameworkStatus === 'all' ? true : frameworkStatus === 'partial' ? 'indeterminate' : false} onCheckedChange={() => toggleFramework(framework)} />
                      <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-secondary">
                        <StandardsIconMapper height={24} width={24} shortName={framework} />
                      </div>
                      <AccordionTrigger className="flex flex-1 items-center justify-between bg-transparent text-left">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{framework}</p>
                            <Badge variant="outline" className="border-brand/30 bg-brand/15 text-brand">
                              {controls.length} controls
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {frameworkStatus === 'all'
                              ? `All ${framework} controls will be added`
                              : frameworkStatus === 'partial'
                                ? `${selectedCount} of ${controls.length} ${framework} controls will be added`
                                : `No ${framework} controls selected`}
                          </p>
                        </div>
                        {expandedFrameworks.includes(framework) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </AccordionTrigger>
                    </div>
                    <AccordionContent>
                      <div className="space-y-2 border-t px-4 py-3">
                        {visibleControls.map((visibleControl) => (
                          <div key={visibleControl.id} className="flex items-start gap-3 rounded-md border p-3">
                            <Checkbox checked={selectedControlSet.has(visibleControl.id)} onCheckedChange={() => toggleControl(visibleControl.id)} />
                            <div>
                              <div className="flex items-center gap-2">
                                <ControlChip
                                  control={{ __typename: ObjectTypes.CONTROL, id: visibleControl.id, refCode: visibleControl.refCode, referenceFramework: visibleControl.referenceFramework }}
                                  hideStandard
                                  disableHref
                                  clickable={false}
                                />
                                {visibleControl.status === ControlControlStatus.ARCHIVED && <Badge variant="outline">Archived</Badge>}
                                {visibleControl.category && <span className="text-xs text-muted-foreground">{visibleControl.category}</span>}
                              </div>
                              {visibleControl.title && <p className="text-sm text-muted-foreground">{visibleControl.title}</p>}
                            </div>
                          </div>
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

export default SelectControlsStep
