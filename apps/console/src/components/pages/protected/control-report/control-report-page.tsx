'use client'

import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useOrganization } from '@/hooks/useOrganization'
import { useStandardsSelect } from '@/lib/graphql-hooks/standards'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { useGetControlsGroupedByCategoryResolver } from '@/lib/graphql-hooks/controls'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { ControlControlStatus } from '@repo/codegen/src/schema'
import { Card } from '@repo/ui/cardpanel'
import { ChevronDown, ChevronsDownUp, List, Settings2 } from 'lucide-react'
import ControlChip from '../controls/map-controls/shared/control-chip'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@repo/ui/tooltip'
import { ControlStatusOrder, ControlStatusTooltips, ControlIconMapper, ControlStatusLabels } from '@/components/shared/enum-mapper/control-enum'
import Link from 'next/link'
import { Button } from '@repo/ui/button'
import { PercentageDonut } from '@/components/shared/percentage-donut.tsx/percentage-donut'
import { useRouter } from 'next/navigation'
import { CreateButton } from '@/components/shared/create-button/create-button'

import { useSession } from 'next-auth/react'
import { canCreate } from '@/lib/authz/utils'
import { useOrganizationRole } from '@/lib/authz/access-api'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import Loading from '@/app/(protected)/control-report/loading'

const ControlReportPage = () => {
  const { currentOrgId } = useOrganization()
  const { setCrumbs } = useContext(BreadcrumbContext)
  const [referenceFramework, setReferenceFramework] = useState<string | undefined>()
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const router = useRouter()
  const { data: sessionData } = useSession()

  const { data: permission } = useOrganizationRole(sessionData)
  const createAllowed = canCreate(permission?.roles, AccessEnum.CanCreateControl)

  const { standardOptions, isSuccess: isSuccessStandards } = useStandardsSelect({
    where: {
      hasControlsWith: [
        {
          hasOwnerWith: [{ id: currentOrgId }],
        },
      ],
    },
    enabled: Boolean(currentOrgId),
  })

  const filteredStandardOptions = useMemo(() => {
    if (!standardOptions) return []
    return standardOptions.map((opt) => ({
      label: opt.label,
      value: opt.label,
    }))
  }, [standardOptions])

  const where = useMemo(() => {
    if (referenceFramework && referenceFramework !== 'Custom') {
      return { referenceFramework: referenceFramework, ownerIDNEQ: '' }
    } else if (referenceFramework === 'Custom') {
      return { referenceFrameworkIsNil: true, ownerIDNEQ: '' }
    }
    return undefined
  }, [referenceFramework])

  const { data, isLoading, isFetching } = useGetControlsGroupedByCategoryResolver({
    where,
    enabled: Boolean(referenceFramework),
  })

  const groupControlsByStatus = (controls: { id: string; refCode: string; status?: string | null }[]): Record<ControlControlStatus, { id: string; refCode: string; status?: string | null }[]> => {
    return ControlStatusOrder.reduce(
      (acc, status) => {
        acc[status] = controls.filter((c) => c.status === status)
        return acc
      },
      {} as Record<ControlControlStatus, typeof controls>,
    )
  }

  const toggleAll = () => {
    if (!data) return

    const allCategories = data.map((item) => item.category)
    const hasAllExpanded = allCategories.every((cat) => expandedItems.includes(cat))

    setExpandedItems(hasAllExpanded ? [] : allCategories)
  }

  const handleRedirectWithFilter = (status: ControlControlStatus) => {
    if (!referenceFramework) return
    const standardId = standardOptions.find((o) => o.label === referenceFramework)?.value || 'Custom'
    const advancedFilters = [
      {
        field: 'standard',
        value: standardId,
        type: 'selectIs',
        operator: 'EQ',
        label: 'Standard',
      },
      {
        field: 'status',
        value: status,
        type: 'select',
        operator: 'EQ',
        label: 'Status',
      },
    ]

    const searchParams = new URLSearchParams({
      filterActive: '1',
      advancedFilters: JSON.stringify(advancedFilters),
    })

    router.push(`/controls?${searchParams.toString()}`)
  }

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Control Report', href: '/control-report' },
    ])
  }, [setCrumbs])

  useEffect(() => {
    if (!isSuccessStandards) return

    const onlyHasCustom = standardOptions.length === 0

    if (onlyHasCustom) {
      setReferenceFramework('Custom')
    } else {
      const first = standardOptions[0]?.label
      setReferenceFramework(first || 'Custom')
    }
  }, [standardOptions, isSuccessStandards])
  if (isLoading || !data) {
    return <Loading />
  }

  return (
    <TooltipProvider>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl tracking-[-0.056rem] text-header">All Controls</h1>
          <Select onValueChange={setReferenceFramework} value={referenceFramework}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Framework" />
            </SelectTrigger>
            <SelectContent>
              {filteredStandardOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
              <SelectItem value="Custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" className="h-8 !px-2" variant="outline" onClick={toggleAll}>
            <div className="flex">
              <List size={16} />
              <ChevronsDownUp size={16} />
            </div>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {createAllowed && <CreateButton type="control" leftIconSize={18} href="/controls/create-control" />}
          <Link href={'/controls'}>
            <Button className="h-8 p-2">View All Controls</Button>
          </Link>
        </div>
      </div>
      <div className="space-y-2">
        {isLoading || isFetching ? (
          <Loading />
        ) : !data || data.length === 0 ? (
          <>
            <div className="flex flex-col items-center justify-center mt-16 gap-6">
              <div className="max-w-3xl p-4 border rounded-lg text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="text-primary">
                    <svg width="20" height="20" fill="currentColor">
                      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
                      <circle cx="10" cy="10" r="1.5" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-base font-medium">What are Controls?</p>
                    <p className="mt-2 text-sm">
                      Controls are the core building blocks of compliance management in Openlane. They represent specific security, privacy, or operational requirements that organizations must
                      implement to meet compliance standards and manage risks effectively.
                      <a href="https://docs.theopenlane.io/docs/docs/platform/controls/overview" target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-500 underline">
                        See docs to learn more.
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <Settings2 className="text-border" size={89} strokeWidth={1} />
                <p className="text-sm text-muted-foreground">No controls found</p>
                <p className="text-sm text-muted-foreground">Ready to get started?</p>
                <div className="flex gap-4 pt-2">
                  <Link href="/standards" passHref>
                    <Button variant="outline" className="h-8">
                      Import from Standards Catalog
                    </Button>
                  </Link>
                  <Link href="/controls/create-control" passHref>
                    <Button className="h-8">Create Custom Controls</Button>
                  </Link>
                </div>
              </div>
            </div>
          </>
        ) : (
          <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems}>
            {data?.map(({ category, controls }) => {
              const controlsByStatus = groupControlsByStatus(controls)
              if (controls.length === 0) return null
              return (
                <AccordionItem className="mt-4" key={category} value={category}>
                  <div className="flex justify-between items-center">
                    <AccordionTrigger asChild className="bg-unset">
                      <button className="size-fit group flex items-center gap-2">
                        <ChevronDown size={22} className="text-brand transform rotate-[-90deg] transition-transform group-data-[state=open]:rotate-0" />
                        <span className="text-xl">{category}</span>
                        <span className="p-1.5 border text-xs text-text-informational rounded-lg">
                          {controlsByStatus.APPROVED.length}/{controls.length}
                        </span>
                      </button>
                    </AccordionTrigger>
                    <PercentageDonut value={controlsByStatus.APPROVED.length} total={controls.length} />
                  </div>
                  <AccordionContent className="pt-4">
                    <Card className="p-4 space-y-4">
                      {ControlStatusOrder.filter((status) => controlsByStatus[status]?.length > 0).map((status, index, arr) => {
                        const isLast = index === arr.length - 1
                        const Icon = ControlIconMapper[status]
                        const controlsForStatus = controlsByStatus[status]

                        return (
                          <div key={status} className={`flex gap-4 ${!isLast ? 'border-b pb-4' : 'pb-0'}`}>
                            <div className="flex gap-2 flex-col min-w-48">
                              <div className="flex items-center gap-2 text-sm">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2 cursor-help">
                                      <Icon className="w-4 h-4" />
                                      <span>{ControlStatusLabels[status]}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>{ControlStatusTooltips[status]}</TooltipContent>
                                </Tooltip>
                              </div>
                              <div className="text-xs">
                                <span>Total:&nbsp;</span>
                                <span onClick={() => handleRedirectWithFilter(status)} className="text-brand cursor-pointer">
                                  {controlsForStatus.length} controls
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {controlsForStatus.map((c) => (
                                <ControlChip key={c.id} control={c} hideStandard />
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </Card>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}
      </div>
    </TooltipProvider>
  )
}

export default ControlReportPage
