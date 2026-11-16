'use client'

import React from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { useOrganizationVendorScoringConfig } from '@/lib/graphql-hooks/vendor-scoring-config'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { VendorRiskDistribution } from './vendor-risk-distribution'
import { useVendorScoringDisplay } from './use-vendor-scoring-display'
import { useSetUpVendorScoring, useVendorScoringAccess } from './use-vendor-scoring-access'
import { VendorScoringSheet } from './configure/vendor-scoring-sheet'
import Skeleton from '@/components/shared/skeleton/skeleton'

const CollapseButton = ({ onClick }: { onClick: () => void }) => (
  <Button type="button" variant="secondary" size="icon-sm" icon={<X size={16} />} descriptiveTooltipText="Hide risk summary" onClick={onClick} />
)

const DefaultsBanner = () => {
  const { collapse, openConfiguration } = useVendorScoringDisplay()
  const { canConfigure, disabledReason } = useVendorScoringAccess()
  const { setUp, isSettingUp, canSetUp } = useSetUpVendorScoring()

  const handleCustomize = async () => {
    if (await setUp()) openConfiguration()
  }

  return (
    <section className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border bg-card px-4 py-3" aria-labelledby="vendor-scoring-defaults-title">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
        <SlidersHorizontal size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <h3 id="vendor-scoring-defaults-title" className="text-sm font-medium">
          Risk scoring is using Openlane defaults
        </h3>
        <p className="text-sm text-muted-foreground">Choose the questions and rating bands that match how your team assesses vendors.</p>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="secondary" onClick={openConfiguration}>
          View defaults
        </Button>
        <DisabledReasonTooltip reason={canConfigure ? undefined : disabledReason}>
          <Button type="button" icon={<SlidersHorizontal size={16} />} iconPosition="left" onClick={handleCustomize} disabled={!canConfigure || !canSetUp || isSettingUp} loading={isSettingUp}>
            Customize scoring
          </Button>
        </DisabledReasonTooltip>
        <CollapseButton onClick={collapse} />
      </div>
    </section>
  )
}

const ScoringSummaryCard = () => {
  const { isExpanded, collapse, openConfiguration } = useVendorScoringDisplay()
  const { isConfigured, isPending, isResolved } = useOrganizationVendorScoringConfig()

  if (!isExpanded) return null

  if (isPending) return <Skeleton height={64} className="mb-4 w-full rounded-lg" />

  if (!isResolved) return null

  if (!isConfigured) return <DefaultsBanner />

  return (
    <VendorRiskDistribution
      actions={
        <>
          <Button type="button" variant="secondary" icon={<SlidersHorizontal size={16} />} iconPosition="left" onClick={openConfiguration}>
            Configure scoring
          </Button>
          <CollapseButton onClick={collapse} />
        </>
      }
    />
  )
}

export const VendorScoringSummary = () => (
  <>
    <ScoringSummaryCard />
    <VendorScoringSheet />
  </>
)
