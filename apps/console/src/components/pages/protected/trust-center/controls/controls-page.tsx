'use client'

import React, { useState, useMemo, useEffect, use, useCallback } from 'react'
import { Button } from '@repo/ui/button'
import { Loading } from '@/components/shared/loading/loading'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { Badge } from '@repo/ui/badge'
import { Input } from '@repo/ui/input'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { BookUp2, ChevronDown, ChevronRight, ChevronsDownUp, List, Minus, Plus, SearchIcon, Trash2 } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { canEdit } from '@/lib/authz/utils'
import { type ControlWhereInput, type ControlListStandardFieldsFragment, ControlTrustCenterControlVisibility } from '@repo/codegen/src/schema'
import { useNavigationGuard } from 'next-navigation-guard'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog'
import { useOrganization } from '@/hooks/useOrganization'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { useAllControlsGroupedWithListFields, useBulkEditControl } from '@/lib/graphql-hooks/control'
import { useDebounce } from '@uidotdev/usehooks'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'

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
  const [removeAllDialogOpen, setRemoveAllDialogOpen] = useState(false)
  const [openSections, setOpenSections] = useState<string[]>([])

  const { data: trustCenterData } = useGetTrustCenter()
  const trustCenterID = trustCenterData?.trustCenters?.edges?.[0]?.node?.id ?? ''
  const { data: tcPermission } = useAccountRoles(ObjectTypes.TRUST_CENTER, trustCenterID)
  const canEditTc = canEdit(tcPermission?.roles)

  const { mutateAsync: bulkEditControl, isPending: isBulkEditing } = useBulkEditControl()

  const filterWhere = useMemo((): ControlWhereInput => {
    const searchFilter: ControlWhereInput = debouncedSearch
      ? {
          or: [{ refCodeContainsFold: debouncedSearch }, { categoryContainsFold: debouncedSearch }, { descriptionContainsFold: debouncedSearch }],
        }
      : {}

    const tabFilter: ControlWhereInput = (() => {
      switch (activeTab) {
        case 'added':
          return { trustCenterVisibility: ControlTrustCenterControlVisibility.PUBLICLY_VISIBLE }
        case 'not-added':
          return { trustCenterVisibilityNEQ: ControlTrustCenterControlVisibility.PUBLICLY_VISIBLE }
        default:
          return {}
      }
    })()

    return {
      isTrustCenterControl: true,
      ...tabFilter,
      ...searchFilter,
    }
  }, [activeTab, debouncedSearch])

  const { allControls, isLoading, groupedControls } = useAllControlsGroupedWithListFields({ where: filterWhere })

  const recommendedControlIds = useMemo(() => {
    if (!currentOrgId || !allControls) return new Set<string>()
    return new Set(allControls.filter((c) => c.mappedCategories && c.mappedCategories.length > 0).map((c) => c.id))
  }, [allControls, currentOrgId])

  const filteredGroupedControls = useMemo(() => {
    if (activeTab !== 'recommended') return groupedControls

    const filtered: Record<string, ControlListStandardFieldsFragment[]> = {}
    for (const [category, controls] of Object.entries(groupedControls)) {
      const rec = controls.filter((c) => recommendedControlIds.has(c.id))
      if (rec.length > 0) filtered[category] = rec
    }
    return filtered
  }, [activeTab, groupedControls, recommendedControlIds])

  const isDirty = useMemo(() => drafts.size > 0, [drafts])
  const publishDisabled = !isDirty || isBulkEditing

  const getEffectiveState = useCallback(
    (control: ControlListStandardFieldsFragment): 'added' | 'not-added' => {
      const draftAction = drafts.get(control.id)
      if (draftAction === 'add') return 'added'
      if (draftAction === 'remove') return 'not-added'
      return control.trustCenterVisibility === ControlTrustCenterControlVisibility.PUBLICLY_VISIBLE ? 'added' : 'not-added'
    },
    [drafts],
  )

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

  const handleRemoveAll = useCallback(() => {
    const addedControls = allControls.filter((c) => c.trustCenterVisibility === ControlTrustCenterControlVisibility.PUBLICLY_VISIBLE)
    setDrafts((prev) => {
      const next = new Map(prev)
      for (const control of addedControls) {
        if (!next.has(control.id)) {
          next.set(control.id, 'remove')
        }
      }
      return next
    })
    setRemoveAllDialogOpen(false)
  }, [allControls])

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

  const handlePublish = useCallback(async () => {
    try {
      const addIds = publishDraftSummary.adds.map((a) => a.id)
      const removeIds = publishDraftSummary.removes.map((r) => r.id)

      if (addIds.length) {
        await bulkEditControl({
          ids: addIds,
          input: { trustCenterVisibility: ControlTrustCenterControlVisibility.PUBLICLY_VISIBLE },
        })
      }

      if (removeIds.length) {
        await bulkEditControl({
          ids: removeIds,
          input: { trustCenterVisibility: ControlTrustCenterControlVisibility.NOT_VISIBLE },
        })
      }

      successNotification({
        title: 'Published',
        description: 'Trust center control selections have been published.',
      })
      setTimeout(() => {
        setDrafts(new Map())
        setPublishDialogOpen(false)
      }, 100)
    } catch (err) {
      errorNotification({
        title: 'Error publishing',
        description: parseErrorMessage(err),
      })
    }
  }, [publishDraftSummary, bulkEditControl, successNotification, errorNotification])

  const allSectionKeys = useMemo(() => Object.keys(filteredGroupedControls), [filteredGroupedControls])

  const toggleAllSections = () => {
    const hasAllOpen = allSectionKeys.every((section) => openSections.includes(section))
    setOpenSections(hasAllOpen ? [] : allSectionKeys)
  }

  useEffect(() => {
    if (allSectionKeys.length > 0 && openSections.length === 0) {
      setOpenSections([allSectionKeys[0]])
    }
  }, [allSectionKeys, openSections.length])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Trust Center', href: '/trust-center/overview' },
      { label: 'Controls', href: '/trust-center/controls' },
    ])
  }, [setCrumbs])

  const navGuard = useNavigationGuard({ enabled: isDirty })

  if (isLoading) return <Loading />

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col mr-6">
          <h2 className="text-2xl font-semibold">Controls</h2>
          <p className="text-sm text-muted-foreground mt-2">Manage which controls are published to your Trust Center. Added controls are publicly visible.</p>
        </div>

        <div className="flex items-center shrink-0 gap-3">
          {canEditTc && (
            <Button variant="outline" icon={<Trash2 />} iconPosition="left" disabled={!allControls.some((c) => c.trustCenterVisibility === ControlTrustCenterControlVisibility.PUBLICLY_VISIBLE)} onClick={() => setRemoveAllDialogOpen(true)}>
              Remove All
            </Button>
          )}
          {canEditTc && (
            <Button icon={<BookUp2 />} iconPosition="left" variant="secondary" disabled={publishDisabled} onClick={() => setPublishDialogOpen(true)}>
              Publish
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 gap-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="added">Added</TabsTrigger>
            <TabsTrigger value="not-added">Not Added</TabsTrigger>
            <TabsTrigger value="recommended">Recommended</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2.5 items-center">
          <Input value={searchQuery} name="controlSearch" placeholder="Search ..." onChange={(e) => setSearchQuery(e.target.value)} icon={<SearchIcon size={16} />} iconPosition="left" variant="searchTable" />
        </div>
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
          return (
            <AccordionItem key={category} value={category}>
              <AccordionTrigger className="flex items-center gap-2 text-lg font-semibold w-full pr-4 pb-4 pt-4 cursor-pointer rounded-lg bg-unset">
                <span>{category}</span>
                <span className="text-sm font-normal text-muted-foreground">({controls.length})</span>
                {isOpen ? <ChevronDown size={22} className="text-brand" /> : <ChevronRight size={22} className="text-brand" />}
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-2">
                  {controls.map((control) => {
                    const effectiveState = getEffectiveState(control)
                    const isAdded = effectiveState === 'added'
                    const hasDraft = drafts.has(control.id)
                    const isRecommended = recommendedControlIds.has(control.id)

                    return (
                      <div key={control.id} className={`flex items-center justify-between p-4 rounded-lg border ${hasDraft ? 'border-brand bg-brand/5' : 'border-border'}`}>
                        <div className="flex flex-col gap-1 flex-1 min-w-0 mr-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{control.refCode}</span>
                            {control.mappedCategories?.map((mc) => (
                              <Badge key={mc} variant="outline">
                                {mc}
                              </Badge>
                            ))}
                            {isRecommended && <Badge variant="green">Recommended</Badge>}
                            {hasDraft && <Badge variant="blue">{drafts.get(control.id) === 'add' ? 'Pending Add' : 'Pending Remove'}</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{control.description || 'No description provided'}</p>
                        </div>

                        {canEditTc && (
                          <Button variant={isAdded ? 'outline' : 'default'} size="sm" icon={isAdded ? <Minus size={14} /> : <Plus size={14} />} iconPosition="left" onClick={() => handleToggle(control)}>
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

      <ConfirmationDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        onConfirm={handlePublish}
        title="Publish Changes"
        description={`You are about to publish ${publishDraftSummary.adds.length} addition(s) and ${publishDraftSummary.removes.length} removal(s) to your Trust Center.`}
        confirmationText="Publish"
      />

      <ConfirmationDialog
        open={removeAllDialogOpen}
        onOpenChange={setRemoveAllDialogOpen}
        onConfirm={handleRemoveAll}
        title="Remove All Controls"
        description="This will stage all currently added controls for removal. You will still need to publish to apply changes."
        confirmationText="Remove All"
        confirmationTextVariant="destructive"
      />

      <CancelDialog isOpen={navGuard.active} onConfirm={navGuard.accept} onCancel={navGuard.reject} />
    </div>
  )
}
