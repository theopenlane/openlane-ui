'use client'

import React, { useState, useMemo, useEffect, use, useCallback } from 'react'
import { Button } from '@repo/ui/button'
import { Loading } from '@/components/shared/loading/loading'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { Badge } from '@repo/ui/badge'
import { Checkbox } from '@repo/ui/checkbox'
import { Input } from '@repo/ui/input'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { ChevronDown, ChevronRight, ChevronsDownUp, List, Minus, Plus, SearchIcon, ShieldCheck, SquareMinus, SquarePlay, SquarePlus } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@repo/ui/dialog'
import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { canEdit } from '@/lib/authz/utils'
import { type ControlWhereInput, type ControlListStandardFieldsFragment, ControlTrustCenterControlVisibility } from '@repo/codegen/src/schema'
import { useNavigationGuard } from 'next-navigation-guard'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog'
import { useOrganization } from '@/hooks/useOrganization'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { useAllControlsGroupedWithListFields, useBulkEditControl, useGetExistingOrgControls } from '@/lib/graphql-hooks/control'
import { useDebounce } from '@uidotdev/usehooks'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { useGetStandards, useCloneControls } from '@/lib/graphql-hooks/standard'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { ControlCategoryIcon } from '@/components/shared/control-category-icon-mapper/control-category-icon-mapper'

type FilterTab = 'all' | 'added' | 'not-added' | 'recommended'
type DraftAction = 'add' | 'remove'

export default function ControlsPage() {
  const { successNotification, errorNotification } = useNotification()
  const { setCrumbs } = use(BreadcrumbContext)
  const { currentOrgId } = useOrganization()

  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [drafts, setDrafts] = useState<Map<string, DraftAction>>(() => new Map())
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [openSections, setOpenSections] = useState<string[]>([])

  const { data: trustCenterData } = useGetTrustCenter()
  const trustCenterID = trustCenterData?.trustCenters?.edges?.[0]?.node?.id ?? ''
  const { data: tcPermission } = useAccountRoles(ObjectTypes.TRUST_CENTER, trustCenterID)
  const canEditTc = canEdit(tcPermission?.roles)

  const { mutateAsync: bulkEditControl, isPending: isBulkEditing } = useBulkEditControl()
  const { queryClient } = useGraphQLClient()

  const { data: otsStandardData } = useGetStandards({
    where: { shortName: 'OTS', framework: 'openlane-trust-center' },
  })
  const otsStandardID = otsStandardData?.standards?.edges?.[0]?.node?.id
  const { mutateAsync: cloneControls, isPending: isCloning } = useCloneControls()

  const filterWhere = useMemo((): ControlWhereInput => {
    return {
      isTrustCenterControl: true,
    }
  }, [])

  const { allControls, isLoading: isLoadingAll, groupedControls } = useAllControlsGroupedWithListFields({ where: filterWhere })
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

  useEffect(() => {
    if (!isLoadingAll && allControls.length >= 0) {
      setHasLoadedOnce(true)
    }
  }, [isLoadingAll, allControls])

  const isLoading = isLoadingAll && !hasLoadedOnce

  const tcRefCodes = useMemo(() => Array.from(new Set(allControls.filter((c) => c.referenceFramework).map((c) => c.refCode))), [allControls])

  const tcFrameworks = useMemo(() => Array.from(new Set(allControls.map((c) => c.referenceFramework).filter((v): v is string => v != null))), [allControls])

  const { data: orgControls } = useGetExistingOrgControls({
    refCodeIn: tcRefCodes,
    referenceFrameworkIn: tcFrameworks,
    enabled: !!currentOrgId && tcRefCodes.length > 0,
  })

  const recommendedControlIds = useMemo(() => {
    if (!currentOrgId || !orgControls) return new Set<string>()

    const orgControlSet = new Set<string>()
    orgControls.controls?.edges?.forEach((edge) => {
      const node = edge?.node
      if (node) orgControlSet.add(`${node.refCode}::${node.referenceFramework ?? 'CUSTOM'}`)
    })

    return new Set(allControls.filter((c) => c.referenceFramework && orgControlSet.has(`${c.refCode}::${c.referenceFramework}`)).map((c) => c.id))
  }, [allControls, currentOrgId, orgControls])

  const getEffectiveState = useCallback(
    (control: ControlListStandardFieldsFragment): 'added' | 'not-added' => {
      const draftAction = drafts.get(control.id)
      if (draftAction === 'add') return 'added'
      if (draftAction === 'remove') return 'not-added'
      return control.trustCenterVisibility === ControlTrustCenterControlVisibility.PUBLICLY_VISIBLE ? 'added' : 'not-added'
    },
    [drafts],
  )

  const tabCounts = useMemo(() => {
    const added = allControls.filter((c) => getEffectiveState(c) === 'added').length
    const notAdded = allControls.length - added
    const recommended = allControls.filter((c) => recommendedControlIds.has(c.id)).length
    return { all: allControls.length, added, 'not-added': notAdded, recommended }
  }, [allControls, recommendedControlIds, getEffectiveState])

  const filteredGroupedControls = useMemo(() => {
    const search = debouncedSearch.toLowerCase()

    const filterControl = (control: ControlListStandardFieldsFragment): boolean => {
      if (search) {
        const matchesSearch =
          control.refCode.toLowerCase().includes(search) ||
          control.title?.toLowerCase().includes(search) ||
          control.category?.toLowerCase().includes(search) ||
          control.description?.toLowerCase().includes(search)
        if (!matchesSearch) return false
      }

      switch (activeTab) {
        case 'added':
          return getEffectiveState(control) === 'added'
        case 'not-added':
          return getEffectiveState(control) === 'not-added'
        case 'recommended':
          return recommendedControlIds.has(control.id)
        default:
          return true
      }
    }

    const filtered: Record<string, ControlListStandardFieldsFragment[]> = {}
    for (const [category, controls] of Object.entries(groupedControls)) {
      const matching = controls.filter(filterControl)
      if (matching.length > 0) filtered[category] = matching
    }
    return filtered
  }, [activeTab, debouncedSearch, groupedControls, recommendedControlIds, getEffectiveState])

  const isDirty = useMemo(() => drafts.size > 0, [drafts])
  const publishDisabled = !isDirty || isBulkEditing

  const handleToggle = useCallback(
    (control: ControlListStandardFieldsFragment) => {
      const currentState = control.trustCenterVisibility === ControlTrustCenterControlVisibility.PUBLICLY_VISIBLE
      const draftAction = drafts.get(control.id)

      setDrafts((prev) => {
        const next = new Map(prev)
        if (draftAction) {
          next.delete(control.id)
        } else {
          next.set(control.id, currentState ? 'remove' : 'add')
        }
        return next
      })
    },
    [drafts],
  )

  const publishDraftSummary = useMemo(() => {
    const adds: { id: string; refCode: string; category: string }[] = []
    const removes: { id: string; refCode: string; category: string }[] = []

    drafts.forEach((action, controlId) => {
      const control = allControls.find((c) => c.id === controlId)
      if (!control) return
      const item = { id: control.id, refCode: control.refCode, category: control.category || 'Uncategorized' }
      if (action === 'add') adds.push(item)
      else removes.push(item)
    })

    return { adds, removes }
  }, [drafts, allControls])

  const publishGroupedByCategory = useMemo(() => {
    const grouped: Record<string, { adds: number; removes: number }> = {}
    for (const item of publishDraftSummary.adds) {
      if (!grouped[item.category]) grouped[item.category] = { adds: 0, removes: 0 }
      grouped[item.category].adds++
    }
    for (const item of publishDraftSummary.removes) {
      if (!grouped[item.category]) grouped[item.category] = { adds: 0, removes: 0 }
      grouped[item.category].removes++
    }
    return grouped
  }, [publishDraftSummary])

  const handlePublish = useCallback(async () => {
    try {
      const addIds = publishDraftSummary.adds.map((a) => a.id)
      const removeIds = publishDraftSummary.removes.map((r) => r.id)

      const results = await Promise.all([
        addIds.length
          ? bulkEditControl({
              ids: addIds,
              input: { trustCenterVisibility: ControlTrustCenterControlVisibility.PUBLICLY_VISIBLE },
            })
          : null,
        removeIds.length
          ? bulkEditControl({
              ids: removeIds,
              input: { trustCenterVisibility: ControlTrustCenterControlVisibility.NOT_VISIBLE },
            })
          : null,
      ])

      const allUpdatedIds = [...(results[0]?.updateBulkControl?.updatedIDs ?? []), ...(results[1]?.updateBulkControl?.updatedIDs ?? [])]

      if (allUpdatedIds.length === 0 && (addIds.length > 0 || removeIds.length > 0)) {
        errorNotification({
          title: 'Error publishing',
          description: 'No controls were updated. Please try again.',
        })
        return
      }

      successNotification({
        title: 'Published',
        description: 'Trust center control selections have been published.',
      })
      setDrafts(new Map())
      setPublishDialogOpen(false)
    } catch (err) {
      errorNotification({
        title: 'Error publishing',
        description: parseErrorMessage(err),
      })
    }
  }, [publishDraftSummary, bulkEditControl, successNotification, errorNotification])

  const isCategoryAllAdded = useCallback(
    (controls: ControlListStandardFieldsFragment[]): boolean => {
      return controls.every((c) => getEffectiveState(c) === 'added')
    },
    [getEffectiveState],
  )

  const handleToggleCategory = useCallback(
    (controls: ControlListStandardFieldsFragment[]) => {
      const allAdded = isCategoryAllAdded(controls)
      setDrafts((prev) => {
        const next = new Map(prev)
        for (const control of controls) {
          const isCurrentlyAdded = control.trustCenterVisibility === ControlTrustCenterControlVisibility.PUBLICLY_VISIBLE
          if (allAdded) {
            if (isCurrentlyAdded) {
              next.set(control.id, 'remove')
            } else {
              next.delete(control.id)
            }
          } else {
            if (!isCurrentlyAdded) {
              next.set(control.id, 'add')
            } else {
              next.delete(control.id)
            }
          }
        }
        return next
      })
    },
    [isCategoryAllAdded],
  )

  const allSectionKeys = useMemo(() => Object.keys(filteredGroupedControls), [filteredGroupedControls])

  const toggleAllSections = () => {
    const hasAllOpen = allSectionKeys.every((section) => openSections.includes(section))
    setOpenSections(hasAllOpen ? [] : allSectionKeys)
  }

  const [initialOpen, setInitialOpen] = useState(false)

  useEffect(() => {
    if (!initialOpen && allSectionKeys.length > 0) {
      setOpenSections([allSectionKeys[0]])
      setInitialOpen(true)
    }
  }, [allSectionKeys, initialOpen])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Trust Center', href: '/trust-center/overview' },
      { label: 'Controls', href: '/trust-center/controls' },
    ])
  }, [setCrumbs])

  const handleAddControls = useCallback(async () => {
    if (!otsStandardID) return
    try {
      await cloneControls({ input: { standardID: otsStandardID } })
      successNotification({
        title: 'Controls added',
        description: 'Trust center controls have been added to your workspace.',
      })
      queryClient.removeQueries({ queryKey: ['controls'] })
    } catch (err) {
      errorNotification({
        title: 'Error adding controls',
        description: parseErrorMessage(err),
      })
    }
  }, [otsStandardID, cloneControls, successNotification, errorNotification, queryClient])

  const navGuard = useNavigationGuard({ enabled: isDirty })

  if (isLoading) return <Loading />

  if (hasLoadedOnce && allControls.length === 0) {
    return (
      <div className="p-4">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ShieldCheck size={48} className="text-brand mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Set up your trust center controls</h2>
          <p className="text-muted-foreground max-w-md mb-6">Add the recommended controls to your workspace. These won&apos;t be published to your trust center until you choose to include them.</p>
          <Button variant="primary" onClick={handleAddControls} disabled={!otsStandardID || isCloning}>
            {isCloning ? 'Adding controls...' : 'Add controls'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col mr-6">
          <h2 className="text-2xl font-semibold">Controls</h2>
        </div>

        <div className="flex items-center shrink-0 gap-3">
          {canEditTc && (
            <Button icon={<SquarePlay />} iconPosition="left" variant="primary" disabled={publishDisabled} onClick={() => setPublishDialogOpen(true)}>
              Publish
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center mb-4 gap-4">
        <Input
          value={searchQuery}
          name="controlSearch"
          placeholder="Search controls..."
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<SearchIcon size={16} />}
          iconPosition="left"
          variant="searchTable"
        />

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)} className="shrink-0">
          <TabsList className="flex-nowrap">
            <TabsTrigger value="all" className="whitespace-nowrap">
              All ({tabCounts.all})
            </TabsTrigger>
            <TabsTrigger value="added" className="whitespace-nowrap">
              Added ({tabCounts.added})
            </TabsTrigger>
            <TabsTrigger value="not-added" className="whitespace-nowrap">
              Not Added ({tabCounts['not-added']})
            </TabsTrigger>
            <TabsTrigger value="recommended" className="whitespace-nowrap">
              Recommended ({tabCounts.recommended})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Accordion type="multiple" value={openSections} onValueChange={setOpenSections} className="w-full">
        <div className="flex gap-2.5 items-center mb-2">
          <p>Domains</p>
          <Button type="button" className="h-8 !px-2" variant="secondary" onClick={toggleAllSections}>
            <div className="flex">
              <List size={16} />
              <ChevronsDownUp size={16} />
            </div>
          </Button>
        </div>

        {Object.entries(filteredGroupedControls).map(([category, controls]) => {
          const isOpen = openSections.includes(category)
          const allAdded = isCategoryAllAdded(controls)
          return (
            <AccordionItem key={category} value={category}>
              <div className="flex items-center justify-between pt-4 pb-4">
                <AccordionTrigger className="flex items-center gap-2 text-lg font-semibold cursor-pointer bg-unset">
                  {isOpen ? <ChevronDown size={22} className="text-brand" /> : <ChevronRight size={22} className="text-brand" />}
                  <ControlCategoryIcon category={category} size={20} className="text-primary" />
                  <span>{category}</span>
                  <span className="text-sm font-normal text-muted-foreground">({controls.length})</span>
                </AccordionTrigger>
                {canEditTc && (
                  <Button variant="secondary" size="md" icon={allAdded ? <Minus size={16} /> : <SquarePlus size={16} />} iconPosition="left" onClick={() => handleToggleCategory(controls)}>
                    {allAdded ? 'Remove All' : 'Add All'}
                  </Button>
                )}
              </div>
              <AccordionContent>
                <div className="flex flex-col gap-2">
                  {controls.map((control) => {
                    const effectiveState = getEffectiveState(control)
                    const isAdded = effectiveState === 'added'
                    const hasDraft = drafts.has(control.id)
                    const isRecommended = recommendedControlIds.has(control.id)

                    return (
                      <div key={control.id} className={`flex items-start justify-between p-4 rounded-lg border bg-card ${hasDraft ? 'border-brand bg-brand/5' : 'border-border'}`}>
                        <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                          {canEditTc && <Checkbox checked={isAdded} onCheckedChange={() => handleToggle(control)} />}
                          <div className="flex flex-col gap-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{control.title || control.refCode}</span>
                              {isRecommended && <Badge variant="green">Recommended</Badge>}
                              {hasDraft && <Badge variant="blue">{drafts.get(control.id) === 'add' ? 'Pending Add' : 'Pending Remove'}</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{control.description || 'No description provided'}</p>
                            {control.tags && control.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {control.tags.map((tag) => (
                                  <Badge key={tag} variant="document">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        {canEditTc && (
                          <Button
                            variant={isAdded ? 'secondary' : 'primary'}
                            size="sm"
                            icon={isAdded ? <Minus size={14} /> : <Plus size={14} />}
                            iconPosition="left"
                            onClick={() => handleToggle(control)}
                            className="shrink-0 py-1"
                          >
                            {isAdded ? 'Remove' : 'Add'}
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>

      {Object.keys(filteredGroupedControls).length === 0 && !isLoading && <p className="text-center text-muted-foreground py-12">No controls found.</p>}

      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Controls</DialogTitle>
            <DialogDescription>
              You are about to publish {publishDraftSummary.adds.length} addition(s) and {publishDraftSummary.removes.length} removal(s) to your Trust Center.
            </DialogDescription>
          </DialogHeader>
          <Accordion type="multiple" className="w-full">
            {Object.entries(publishGroupedByCategory).map(([category, counts]) => {
              const total = counts.adds + counts.removes
              return (
                <AccordionItem key={category} value={category} className="border rounded-lg px-3 mb-2">
                  <AccordionTrigger className="flex items-center justify-between w-full py-3 cursor-pointer bg-unset">
                    <div className="flex items-center gap-2">
                      <ChevronDown size={16} className="text-brand" />
                      <ControlCategoryIcon category={category} size={16} className="text-primary" />
                      <span className="font-medium">{category}</span>
                    </div>
                    <Badge variant="outline">{total}</Badge>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground pl-9">
                      {publishDraftSummary.adds
                        .filter((a) => a.category === category)
                        .map((a) => (
                          <div key={a.id} className="flex items-center gap-1.5">
                            <Plus size={12} className="text-green-500" />
                            <span>{a.refCode}</span>
                          </div>
                        ))}
                      {publishDraftSummary.removes
                        .filter((r) => r.category === category)
                        .map((r) => (
                          <div key={r.id} className="flex items-center gap-1.5">
                            <Minus size={12} className="text-red-500" />
                            <span>{r.refCode}</span>
                          </div>
                        ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setPublishDialogOpen(false)}>
              Back
            </Button>
            <Button variant="primary" icon={<SquarePlay />} iconPosition="left" disabled={isBulkEditing} onClick={handlePublish}>
              {isBulkEditing ? 'Publishing...' : 'Publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CancelDialog isOpen={navGuard.active} onConfirm={navGuard.accept} onCancel={navGuard.reject} />
    </div>
  )
}
