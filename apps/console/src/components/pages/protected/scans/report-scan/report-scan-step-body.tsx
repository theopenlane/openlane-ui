'use client'

import React from 'react'
import { Badge } from '@repo/ui/badge'
import { SOC_2_FRAMEWORK_NAME } from '@/constants/trust-services-categories'
import { existingNameKey, type ReportScanExistingIds } from '@/lib/graphql-hooks/report-scan'
import { ConfirmStep } from '../shared/confirm-step'
import { VendorLogo } from '../shared/vendor-logo'
import { guessDomainFromName, resolveVendorLogoUrl } from '../domain-scan/notification-mappers'
import type { ScanSummarySection } from '../shared/types'
import type { ReportScanState } from './hooks/use-report-scan-state'
import { PlatformStep } from './steps/platform-step'
import { ProgramStep } from './steps/program-step'
import { ReviewsStep } from './steps/reviews-step'
import { SelectableListStep } from './steps/selectable-list-step'
import { SystemsStep } from './steps/systems-step'
import type { ParsedReport, ReportStepId } from './types'

type ReportScanStepBodyProps = {
  stepId: ReportStepId
  report: ParsedReport
  state: ReportScanState
  existing: ReportScanExistingIds
  summarySections: ScanSummarySection<ReportStepId>[]
}

export const ReportScanStepBody = ({ stepId, report, state, existing, summarySections }: ReportScanStepBodyProps) => {
  const reviewTitleOf = (reviewId?: string) => (reviewId ? report.reviews.find((review) => review.id === reviewId)?.title : undefined)

  switch (stepId) {
    case 'platforms':
      return (
        <PlatformStep
          platforms={report.platforms}
          selected={state.selection.platforms}
          setSelected={state.setSectionSelection('platforms')}
          overrides={state.platformOverrides}
          onChange={state.updatePlatform}
          existingPlatformIds={existing.platforms}
        />
      )
    case 'systems':
      return (
        <SystemsStep
          systems={report.systems}
          platforms={report.platforms}
          platformOverrides={state.platformOverrides}
          selected={state.selection.systems}
          setSelected={state.setSectionSelection('systems')}
          overrides={state.systemOverrides}
          onChange={state.updateSystem}
        />
      )
    case 'vendors':
      return (
        <SelectableListStep
          title="Review vendors"
          description="The subservice organizations named in your report, with each one's logo looked up from its domain. Vendors you already have are marked, selecting one links it instead of creating a duplicate."
          noun="vendors"
          items={report.vendors}
          selected={state.selection.vendors}
          setSelected={state.setSectionSelection('vendors')}
          renderRow={(vendor) => ({
            title: vendor.displayName ?? vendor.name,
            description: vendor.description,
            badges: vendor.providedServices,
            leading: <VendorLogo name={vendor.name} logoUrl={resolveVendorLogoUrl(vendor.domains[0] ?? guessDomainFromName(vendor.name))} />,
            alreadyAdded: !!existing.vendors[existingNameKey(vendor.name)],
          })}
        />
      )
    case 'assets':
      return (
        <SelectableListStep
          title="Review assets"
          description="The systems and infrastructure your report describes as in scope. Assets that name a vendor are linked to it."
          noun="assets"
          items={report.assets}
          selected={state.selection.assets}
          setSelected={state.setSectionSelection('assets')}
          renderRow={(asset) => ({
            title: asset.displayName ?? asset.name,
            description: [asset.description, asset.vendorName ? `Vendor: ${asset.vendorName}` : undefined].filter(Boolean).join(' · ') || undefined,
            badges: asset.assetType ? [asset.assetType] : undefined,
            alreadyAdded: !!existing.assets[existingNameKey(asset.name)],
          })}
        />
      )
    case 'groups':
      return (
        <SelectableListStep
          title="Review groups"
          description="The roles your report names as responsible for parts of the program. Groups are created empty, you add people to them after the import."
          noun="groups"
          items={report.groups}
          selected={state.selection.groups}
          setSelected={state.setSectionSelection('groups')}
          renderRow={(group) => ({ title: group.displayName ?? group.name, description: group.description, alreadyAdded: !!existing.groups[existingNameKey(group.name)] })}
        />
      )
    case 'controls':
      return (
        <SelectableListStep
          title="Review your controls"
          description={`One row per control your organization operates, mapped to the ${SOC_2_FRAMEWORK_NAME} criteria it satisfies. A control often covers more than one.`}
          noun="controls"
          items={report.controls}
          selected={state.selection.controls}
          setSelected={state.setSectionSelection('controls')}
          renderRow={(control) => ({
            title: (
              <span className="flex flex-wrap items-baseline gap-2">
                <span className="font-mono text-sm text-primary">{control.refCode}</span>
                {control.title}
              </span>
            ),
            description: (
              <>
                {control.description ? <span className="block">{control.description}</span> : null}
                {control.criteria.length > 0 ? (
                  <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                    Satisfies
                    {control.criteria.map((criteria) => (
                      <Badge key={criteria} variant="outline" className="font-mono">
                        {criteria}
                      </Badge>
                    ))}
                  </span>
                ) : null}
              </>
            ),
            alreadyAdded: !!existing.controls[control.refCode],
          })}
        />
      )
    case 'reviews':
      return <ReviewsStep reviews={report.reviews} controls={report.controls} selected={state.selection.reviews} setSelected={state.setSectionSelection('reviews')} />
    case 'findings':
      return (
        <SelectableListStep
          title="Review findings"
          description="The exceptions and deviations the auditor noted. Each one is linked to the controls it was raised against and to the review whose test found it."
          noun="findings"
          items={report.findings}
          selected={state.selection.findings}
          setSelected={state.setSectionSelection('findings')}
          renderRow={(finding) => {
            const reviewTitle = reviewTitleOf(finding.reviewId)
            return {
              title: finding.description,
              description:
                finding.refCodes.length > 0 || reviewTitle ? (
                  <>
                    {finding.refCodes.length > 0 ? <span className="block">Controls: {finding.refCodes.join(', ')}</span> : null}
                    {reviewTitle ? <span className="block">Review: {reviewTitle}</span> : null}
                  </>
                ) : undefined,
              badges: [finding.severity, finding.open === false ? 'Closed' : undefined].filter((badge): badge is string => !!badge),
            }
          }}
        />
      )
    case 'program':
      return <ProgramStep program={state.program} setProgram={state.setProgram} reportedCategories={report.reportedCategories} />
    case 'confirm':
      return <ConfirmStep sections={summarySections} onEditStep={state.setStepId} />
    default:
      stepId satisfies never
      return null
  }
}
