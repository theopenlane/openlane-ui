'use client'

import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useOrganization } from '@/hooks/useOrganization'
import { useStandardsSelect } from '@/lib/graphql-hooks/standards'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { useGetControlsGroupedByCategoryResolver } from '@/lib/graphql-hooks/controls'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { ControlControlStatus } from '@repo/codegen/src/schema'
import { Card } from '@repo/ui/cardpanel'
import { ChevronDown, Circle, RefreshCw, RouteOff, ScanEye, Stamp } from 'lucide-react'
import ControlChip from '../controls/map-controls/shared/control-chip'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

const STATUS_ORDER: ControlControlStatus[] = [
  ControlControlStatus.NOT_IMPLEMENTED,
  ControlControlStatus.PREPARING,
  ControlControlStatus.NEEDS_APPROVAL,
  ControlControlStatus.CHANGES_REQUESTED,
  ControlControlStatus.APPROVED,
  ControlControlStatus.ARCHIVED,
]

const STATUS_LABELS: Record<ControlControlStatus, string> = {
  [ControlControlStatus.NOT_IMPLEMENTED]: 'Not Implemented',
  [ControlControlStatus.PREPARING]: 'Preparing',
  [ControlControlStatus.NEEDS_APPROVAL]: 'Needs Approval',
  [ControlControlStatus.CHANGES_REQUESTED]: 'Changes Requested',
  [ControlControlStatus.APPROVED]: 'Approved',
  [ControlControlStatus.ARCHIVED]: 'Archived',
}

const STATUS_ICONS: Record<ControlControlStatus, React.ElementType> = {
  [ControlControlStatus.NOT_IMPLEMENTED]: RouteOff,
  [ControlControlStatus.PREPARING]: Circle,
  [ControlControlStatus.NEEDS_APPROVAL]: ScanEye,
  [ControlControlStatus.CHANGES_REQUESTED]: RefreshCw,
  [ControlControlStatus.APPROVED]: Stamp,
  [ControlControlStatus.ARCHIVED]: Circle,
}

const ControlReportPage = () => {
  const { currentOrgId } = useOrganization()
  const [referenceFramework, setReferenceFramework] = useState<string | undefined>()
  const { setCrumbs } = useContext(BreadcrumbContext)

  const { standardOptions } = useStandardsSelect({
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
      return { referenceFramework: referenceFramework }
    } else if (referenceFramework === 'Custom') {
      return { referenceFrameworkIsNil: true }
    }
    return undefined
  }, [referenceFramework])

  const { data, isLoading } = useGetControlsGroupedByCategoryResolver({
    where,
    enabled: Boolean(referenceFramework),
  })

  const grouped = useMemo(() => {
    if (!data?.controlsGroupByCategory?.edges) return []
    return data.controlsGroupByCategory.edges.map((edge) => ({
      category: edge.node.category,
      controls: edge?.node?.controls?.edges?.map((e) => e!.node).filter((node) => !!node) || [],
    }))
  }, [data])

  const groupControlsByStatus = (controls: { id: string; refCode: string; status?: ControlControlStatus | null }[]) => {
    return STATUS_ORDER.reduce(
      (acc, status) => {
        acc[status] = controls.filter((c) => c.status === status)
        return acc
      },
      {} as Record<ControlControlStatus, typeof controls>,
    )
  }

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Control Report', href: '/control-report' },
    ])
  }, [setCrumbs])

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Select Framework</label>
      <Select onValueChange={setReferenceFramework} value={referenceFramework}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select Framework" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Custom">Custom</SelectItem>
          {filteredStandardOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isLoading && <p>Loading controls...</p>}

      <Accordion type="multiple">
        {grouped.map(({ category, controls }) => {
          const controlsByStatus = groupControlsByStatus(controls)
          return (
            <AccordionItem className="mt-4" key={category} value={category}>
              <AccordionTrigger asChild>
                <button className="size-fit group flex items-center gap-2">
                  <ChevronDown size={22} className="text-brand transform rotate-[-90deg] transition-transform group-data-[state=open]:rotate-0" />
                  <span className="text-xl">{category}</span>
                  <span className="p-1.5 border text-xs text-text-informational rounded-lg">
                    {controlsByStatus.APPROVED.length}/{controls.length}
                  </span>
                </button>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <Card className="p-4 space-y-4">
                  {(() => {
                    const nonEmptyStatuses = STATUS_ORDER.filter((status) => controlsByStatus[status] && controlsByStatus[status].length > 0)

                    return nonEmptyStatuses.map((status, index) => {
                      const controls = controlsByStatus[status]
                      const Icon = STATUS_ICONS[status]
                      const isLast = index === nonEmptyStatuses.length - 1

                      return (
                        <div key={status} className={`flex gap-4 ${!isLast ? 'border-b pb-4' : 'pb-0'}`}>
                          <div className="flex gap-2 flex-col min-w-48">
                            <div className="flex items-center gap-2 text-sm">
                              <Icon className="w-4 h-4" />
                              <span>{STATUS_LABELS[status]}</span>
                            </div>
                            <div className="text-xs">
                              <span>Total:&nbsp;</span>
                              <span className="text-brand">{controls.length} controls</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {controls.map((c) => (
                              <ControlChip key={c.id} control={c} hideStandard />
                            ))}
                          </div>
                        </div>
                      )
                    })
                  })()}
                </Card>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}

export default ControlReportPage
