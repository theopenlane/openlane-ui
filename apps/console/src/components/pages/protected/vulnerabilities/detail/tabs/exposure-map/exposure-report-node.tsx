'use client'

import React, { createContext, use } from 'react'
import { ArrowRight } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { cn } from '@repo/ui/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { type VulnerabilityExposureNode } from '@/lib/graphql-hooks/vulnerability'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { useOpenObjectSheet } from '@/providers/sheet-navigation-provider'
import { VulnerabilitySourceDetails } from '../../source/vulnerability-source-details'

type TExposureSelectionContext = {
  selectedIds: ReadonlySet<string>
  canSelect: boolean
  onToggle: (reportId: string, selected: boolean) => void
}

export const ExposureSelectionContext = createContext<TExposureSelectionContext>({ selectedIds: new Set(), canSelect: false, onToggle: () => undefined })

const StatusDot: React.FC<{ isOpen: boolean }> = ({ isOpen }) => <span className={cn('size-1.5 shrink-0 rounded-full', isOpen ? 'bg-destructive' : 'bg-muted-foreground')} />

export type TExposureReportCardProps = {
  report: VulnerabilityExposureNode
  title: string
  subtitle?: string
  dueLabel?: string | null
  isOpen: boolean
  isCurrent: boolean
}

export const ExposureReportCard: React.FC<TExposureReportCardProps> = ({ report, title, subtitle, dueLabel, isOpen, isCurrent }) => {
  const { selectedIds, canSelect, onToggle } = use(ExposureSelectionContext)
  const openObjectSheet = useOpenObjectSheet()
  const isSelected = selectedIds.has(report.id)

  return (
    <div
      className={cn(
        'flex w-[260px] items-start gap-2 rounded-md border px-3 py-2',
        isOpen ? 'border-destructive/60 bg-destructive/10' : 'bg-muted/40 text-muted-foreground',
        isCurrent && 'ring-1 ring-destructive',
        isSelected && 'ring-2 ring-primary',
      )}
    >
      {canSelect && (
        <Checkbox className="nodrag nopan mt-0.5" checked={isSelected} aria-label={`Select report ${report.externalID}`} onCheckedChange={(checked) => onToggle(report.id, checked === true)} />
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="transparent"
            aria-label={`Show details for report ${report.externalID}`}
            className="nodrag nopan h-auto min-w-0 flex-1 justify-start overflow-hidden border-0 p-0 *:min-w-0 *:w-full text-left font-normal text-inherit hover:border-0 hover:bg-transparent"
          >
            <span className="flex w-full min-w-0 flex-col">
              <span className="flex items-center gap-1.5 text-sm">
                <StatusDot isOpen={isOpen} />
                <span className={cn('truncate', isCurrent ? 'font-bold' : 'font-medium')}>{title}</span>
                {isCurrent && <span className="shrink-0 rounded border px-1 text-[10px] font-medium">This record</span>}
              </span>
              {subtitle && <span className="truncate font-mono text-xs text-muted-foreground">{subtitle}</span>}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent side="right" align="start" className="w-[380px] max-w-[calc(100vw-2rem)]">
          <VulnerabilitySourceDetails
            fields={report}
            header={
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <StatusDot isOpen={isOpen} />
                  {dueLabel ? `${title} · ${dueLabel}` : title}
                </span>
                {report.source && (
                  <Badge variant="outline" className="truncate">
                    {report.source}
                  </Badge>
                )}
              </div>
            }
            extraRows={[{ label: 'Manifest', value: report.manifestPath }]}
            footer={
              !isCurrent && (
                <Button type="button" variant="secondary" className="w-full gap-1.5" onClick={() => openObjectSheet(report.id, ObjectAssociationNodeEnum.VULNERABILITY)}>
                  Open vulnerability
                  <ArrowRight size={14} />
                </Button>
              )
            }
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
