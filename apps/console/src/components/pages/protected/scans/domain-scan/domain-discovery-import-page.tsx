'use client'

import React, { useMemo } from 'react'
import { defineStepper } from '@stepperize/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { PageHeading } from '@repo/ui/page-heading'
import { resolveSystemTargets } from './build-import-payload'
import { ScanFoundSummary } from './components/scan-found-summary'
import { ScanSummarySidebar } from './components/scan-summary-sidebar'
import { AssetsStep } from './steps/assets-step'
import { ConfirmStep } from './steps/confirm-step'
import { FindingsStep } from './steps/findings-step'
import { LinkStep } from './steps/link-step'
import { PlatformStep } from './steps/platform-step'
import { SystemsStep } from './steps/systems-step'
import { VendorsStep } from './steps/vendors-step'
import { useDomainScanImport } from './hooks/use-domain-scan-import'
import { useDomainScanReport } from './hooks/use-domain-scan-report'
import { useDomainScanSelection } from './hooks/use-domain-scan-selection'
import { domainScanProgressStorageKey } from './progress-storage'
import type { EditableStepId, LinkableItem } from './types'

const { useStepper } = defineStepper(
  { id: 'platform', label: 'Platform' },
  { id: 'systems', label: 'System Details' },
  { id: 'assets', label: 'Assets' },
  { id: 'vendors', label: 'Vendors' },
  { id: 'link', label: 'Link' },
  { id: 'findings', label: 'Findings' },
  { id: 'confirm', label: 'Confirm' },
)

const DomainDiscoveryImportPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const stepper = useStepper()
  const scanIdParam = searchParams.get('scanId') ?? searchParams.get('id')

  const report = useDomainScanReport(scanIdParam)
  const storageKey = useMemo(() => (scanIdParam ? domainScanProgressStorageKey(scanIdParam) : undefined), [scanIdParam])

  const selection = useDomainScanSelection({
    report,
    storageKey,
    currentStepId: stepper.state.current.data.id,
    goToStep: (stepId) => stepper.navigation.goTo(stepId),
  })

  const { handleImport, isImporting, canImport } = useDomainScanImport({ report, selection, storageKey })

  const { domains, allDomains, vendors, findings, agentReadiness } = report
  const isSingleMode = selection.platformMode === 'single'

  const linkPlatformTargets = useMemo<LinkableItem[]>(() => selection.platformTargets.map((target) => ({ id: target.id, name: target.name })), [selection.platformTargets])
  const linkSystemTargets = useMemo<LinkableItem[]>(
    () => (isSingleMode ? selection.resolvedSystemTargets.map((system) => ({ id: system.id, name: system.name })) : []),
    [isSingleMode, selection.resolvedSystemTargets],
  )

  const confirmPlatforms = selection.platformTargets.map((target) => ({ id: target.id, name: target.name, description: target.description }))
  const confirmSystems = useMemo(
    () =>
      resolveSystemTargets({
        platformMode: selection.platformMode,
        platformTargets: selection.platformTargets,
        systemTargets: selection.resolvedSystemTargets,
        singlePlatformRef: selection.resolvedSinglePlatformTarget.id,
      }).map((target) => ({ id: target.id, name: target.name, description: target.description })),
    [selection.platformMode, selection.platformTargets, selection.resolvedSinglePlatformTarget.id, selection.resolvedSystemTargets],
  )
  const confirmSystemVendorLinks = isSingleMode ? selection.systemVendorLinks : selection.platformVendorLinks

  const goToStep = (stepId: EditableStepId) => stepper.navigation.goTo(stepId)

  const handleFinishLater = () => {
    selection.persistProgress()
    router.push('/notifications')
  }

  const handleNextButton = () => {
    if (!stepper.state.isLast) {
      stepper.navigation.next()
      return
    }

    void handleImport()
  }

  if (!report.notificationData) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <PageHeading eyebrow="Discovery" heading="Domain Discovery Results" />
        <div className="mt-4 rounded-md border border-border p-6">
          <p className="text-base font-medium">This report is no longer available</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {report.scanQuery?.scan
              ? `The scan for ${report.scanQuery.scan.target ?? 'this domain'} still exists, but its detailed report is only kept in the notification that delivered it. Try opening it again from the notification bell.`
              : 'Try opening this report again from the notification bell, or re-run the scan.'}
          </p>
          <Button className="mt-4" variant="secondary" onClick={() => router.push('/notifications')}>
            Back to notifications
          </Button>
        </div>
      </div>
    )
  }

  if (!selection.hasStarted) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <PageHeading eyebrow="Discovery" heading="Review what we found" />
        <p className="mt-1 text-sm text-muted-foreground">
          We scanned {domains.hostname} to identify platforms, systems, vendors, assets, and findings that may be part of your organization. Review and edit each section before adding it to Openlane.
        </p>

        <div className="mt-6">
          <ScanFoundSummary
            hostname={domains.hostname}
            systemsCount={selection.displaySystemCandidates.length}
            assetsCount={allDomains.length}
            vendorsCount={vendors.length}
            findingsCount={findings.length}
          />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Button variant="secondary" onClick={handleFinishLater}>
            Finish later
          </Button>
          <Button variant="primary" onClick={() => selection.setHasStarted(true)}>
            Get started
          </Button>
        </div>
      </div>
    )
  }

  const currentStepIndex = stepper.state.all.findIndex((step) => step.id === stepper.state.current.data.id)
  const isConfirmStep = stepper.state.current.data.id === 'confirm'

  return (
    <div className="mx-auto max-w-6xl px-6 py-4">
      <PageHeading eyebrow="Discovery" heading="Review what we found" />
      <p className="mt-1 text-sm text-muted-foreground">
        We scanned {domains.hostname} to identify platforms, systems, vendors, assets, and findings that may be part of your organization. Review and edit each section before adding it to Openlane.
      </p>

      <div className={`mt-6 grid grid-cols-1 gap-6 ${isConfirmStep ? '' : 'lg:grid-cols-[2fr_1fr]'}`}>
        <div className="min-w-0">
          <div className="mb-6 flex flex-col gap-3">
            <Badge variant="primary" className="w-fit uppercase tracking-wide border-primary/24">
              Step {currentStepIndex + 1} of {stepper.state.all.length} - {stepper.state.current.data.label}
            </Badge>
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all" style={{ width: `${((currentStepIndex + 1) / stepper.state.all.length) * 100}%` }} />
            </div>
          </div>

          <div className="mb-6 flex items-center justify-between">
            <Button variant="secondary" onClick={handleFinishLater}>
              Finish later
            </Button>

            <div className="flex items-center gap-3">
              {!stepper.state.isFirst ? (
                <Button variant="secondary" onClick={() => stepper.navigation.prev()}>
                  Back
                </Button>
              ) : null}
              <Button variant="primary" onClick={handleNextButton} loading={isImporting} disabled={isImporting || (stepper.state.isLast && !canImport)}>
                {stepper.state.isLast ? 'Import' : 'Save and continue'}
              </Button>
            </div>
          </div>

          {stepper.flow.switch({
            platform: () => (
              <PlatformStep
                mode={selection.platformMode}
                setMode={selection.setPlatformMode}
                hostname={domains.hostname}
                singleCandidate={report.singlePlatformCandidate}
                singleOverride={selection.singlePlatformOverride}
                setSingleOverride={selection.setSinglePlatformOverride}
                perSystemCandidates={report.perSystemPlatformCandidates}
                selectedPerSystemIds={selection.selectedPerSystemPlatformIds}
                setSelectedPerSystemIds={selection.setSelectedPerSystemPlatformIds}
                perSystemOverrides={selection.perSystemPlatformOverrides}
                setPerSystemOverrides={selection.setPerSystemPlatformOverrides}
                existingPlatformNames={report.existingPlatformNames}
              />
            ),
            systems: () => (
              <SystemsStep
                mode={selection.platformMode}
                systemCandidates={selection.displaySystemCandidates}
                systemOverrides={selection.systemOverrides}
                setSystemOverrides={selection.setSystemOverrides}
                onAddSystem={selection.addManualSystem}
                onRemoveSystem={selection.removeSystem}
                existingSystemNames={report.existingSystemNames}
              />
            ),
            assets: () => (
              <AssetsStep
                domains={domains}
                selected={selection.selectedDomainIds}
                setSelected={selection.setSelectedDomainIds}
                existingIds={report.existingAssetIds}
                overrides={selection.domainOverrides}
                setOverrides={selection.setDomainOverrides}
              />
            ),
            vendors: () => (
              <VendorsStep
                vendors={vendors}
                selected={selection.selectedVendorIds}
                setSelected={selection.setSelectedVendorIds}
                existingIds={report.existingVendorIds}
                overrides={selection.vendorOverrides}
                setOverrides={selection.setVendorOverrides}
              />
            ),
            link: () => (
              <LinkStep
                platforms={linkPlatformTargets}
                systems={linkSystemTargets}
                vendors={selection.linkVendors}
                assets={selection.linkAssets}
                defaultVendorIds={selection.defaultLinkedVendorIds}
                defaultAssetIds={selection.defaultLinkedAssetIds}
                vendorLinks={selection.platformVendorLinks}
                setVendorLinks={selection.setPlatformVendorLinks}
                assetLinks={selection.platformAssetLinks}
                setAssetLinks={selection.setPlatformAssetLinks}
                systemVendorLinks={selection.systemVendorLinks}
                setSystemVendorLinks={selection.setSystemVendorLinks}
                systemAssetLinks={selection.systemAssetLinks}
                setSystemAssetLinks={selection.setSystemAssetLinks}
              />
            ),
            findings: () => (
              <FindingsStep
                findings={findings}
                selected={selection.selectedFindingIds}
                setSelected={selection.setSelectedFindingIds}
                agentReadiness={agentReadiness}
                overrides={selection.findingOverrides}
                setOverrides={selection.setFindingOverrides}
              />
            ),
            confirm: () => (
              <ConfirmStep
                platforms={confirmPlatforms}
                systems={confirmSystems}
                vendors={selection.linkVendors}
                assets={selection.linkAssets}
                findings={selection.confirmFindings}
                platformVendorLinks={selection.platformVendorLinks}
                systemVendorLinks={confirmSystemVendorLinks}
                defaultLinkedVendorIds={selection.defaultLinkedVendorIds}
                systemsDefaultToPlatformLinks={!isSingleMode}
                onEditStep={goToStep}
              />
            ),
          })}
        </div>

        {!isConfirmStep ? (
          <div>
            <ScanSummarySidebar
              platforms={linkPlatformTargets}
              systems={confirmSystems}
              vendors={selection.linkVendors}
              assets={selection.linkAssets}
              findings={selection.confirmFindings}
              onEditStep={goToStep}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default DomainDiscoveryImportPage
