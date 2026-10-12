'use client'

import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { CircleCheck, Clock, Wand } from 'lucide-react'
import { type BrandFormValues } from '../brand-schema'
import SectionWarning from '../section-warning'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { usePullBrandingFromDomain } from '../helpers/use-pull-branding-from-domain'
import { useDomainScanWindow } from '@/components/shared/domain-branding/use-domain-scan-window'
import { useOrganizationDomainOptions } from '@/components/shared/domain-branding/use-organization-domain-options'
import { getDomainScanBlockedReason, NO_DOMAIN_REASON } from '@/components/shared/domain-branding/domain-scan-blocked-reason'
import { DomainSelectField } from '@/components/shared/domain-branding/domain-select-field'
import { useRecentDomainBranding } from '@/components/shared/domain-branding/use-recent-domain-branding'
import { Callout } from '@/components/shared/callout/callout'
import { useNotification } from '@/hooks/useNotification'
import { formatTimeSince } from '@/utils/date'
import { applyScanBranding } from '../helpers/apply-scan-branding'
import { type TrustCenterPreviewSetting } from '@/lib/graphql-hooks/trust-center'

const DOMAIN_SELECT_ID = 'branding-domain-pull-domain'

const PULL_SUMMARY = ['Colors, fonts, logo, and favicon', 'Applies to preview settings only', 'Uploaded assets stay unchanged', 'Nothing goes live until you publish']

interface BrandingDomainPullProps {
  isReadOnly: boolean
  previewSetting: TrustCenterPreviewSetting
  onPulled: () => void
}

export const BrandingDomainPull = ({ isReadOnly, previewSetting, onPulled }: BrandingDomainPullProps) => {
  const [open, setOpen] = useState(false)
  const [pickedDomain, setPickedDomain] = useState('')

  const { formState, watch, setValue, getValues, getFieldState } = useFormContext<BrandFormValues>()
  const { successNotification, warningNotification } = useNotification()
  const { domainOptions, isLoadingDomains, refetchDomains } = useOrganizationDomainOptions(!isReadOnly, watch('companyDomain'))
  const { isDetecting: isPulling, detectBranding } = usePullBrandingFromDomain(onPulled)
  const { isCheckingWindow, scanHistoryUnavailable, runningScanTarget, availableIn } = useDomainScanWindow(!isReadOnly)
  const { recentBrandingByDomain, isLoadingRecentBranding } = useRecentDomainBranding({ domains: domainOptions, enabled: open, isScanRunning: !!runningScanTarget })

  const selectedDomain = domainOptions.includes(pickedDomain) ? pickedDomain : (domainOptions[0] ?? '')
  const recentBranding = recentBrandingByDomain.get(selectedDomain)
  const hasDomains = domainOptions.length > 0
  const isCheckingBlockers = isCheckingWindow || isLoadingDomains || isLoadingRecentBranding
  const blockedReason = getDomainScanBlockedReason({ isChecking: isCheckingBlockers, scanHistoryUnavailable, hasDomains, availableIn, runningScanTarget }, 'pull branding')
  const triggerBlockedReason = !isLoadingDomains && !hasDomains ? NO_DOMAIN_REASON : null

  const handleUseDetected = () => {
    if (!recentBranding) return
    const applied = applyScanBranding({ setValue, getValues, getFieldState }, recentBranding.branding, previewSetting)
    setOpen(false)
    if (applied === 0) {
      warningNotification({ title: 'No branding to apply', description: `The branding detected for ${selectedDomain} has nothing we can use here.` })
      return
    }
    successNotification({ title: 'Branding applied', description: `Branding from ${selectedDomain} was applied to the form. Remember to Preview or Publish.` })
  }

  const handlePull = async () => {
    if (!selectedDomain) return
    const started = await detectBranding(selectedDomain)
    if (started) {
      setOpen(false)
    }
  }

  if (isReadOnly) return null

  const triggerButton = (
    <Button
      type="button"
      variant="secondary"
      icon={<Wand size={16} />}
      loading={isPulling}
      disabled={isPulling || isLoadingDomains || !!triggerBlockedReason}
      onClick={() => {
        refetchDomains()
        setOpen(true)
      }}
    >
      {isPulling ? 'Detecting branding' : 'Detect Branding from Domain'}
    </Button>
  )

  return (
    <>
      <DisabledReasonTooltip reason={triggerBlockedReason}>{triggerButton}</DisabledReasonTooltip>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pull branding from domain</DialogTitle>
            <DialogDescription>We&apos;ll import branding from your website into preview settings only.</DialogDescription>
          </DialogHeader>

          {blockedReason && !recentBranding ? (
            <Callout variant="warning">{blockedReason}</Callout>
          ) : (
            <SectionWarning
              className="mb-0"
              icon={<Clock className="text-primary shrink-0 mt-0.5" size={16} />}
              message={
                <>
                  <p className="text-sm font-medium">This can take a few minutes to complete.</p>
                  <p className="text-sm text-inverted-muted-foreground">We&apos;ll let you know when it&apos;s done.</p>
                </>
              }
            />
          )}

          <ul className="flex flex-col gap-2">
            {PULL_SUMMARY.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm">
                <CircleCheck className="text-primary shrink-0" size={16} />
                {item}
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-4">
            <DomainSelectField id={DOMAIN_SELECT_ID} domains={domainOptions} value={selectedDomain} onValueChange={setPickedDomain} />

            {recentBranding && (
              <Callout variant="plain">{`Branding for ${selectedDomain} was detected ${formatTimeSince(recentBranding.scannedAt)}. You can apply it to this form without running a new scan, then Preview or Publish.`}</Callout>
            )}

            {formState.isDirty && (
              <SectionWarning
                className="mb-0"
                message={
                  recentBranding
                    ? 'You have unsaved edits on this page. Pulling again discards all of them; using detected branding only replaces colors, font, logo and favicon.'
                    : 'You have unsaved edits on this page. Pulling discards all of them.'
                }
              />
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            {recentBranding && (
              <Button type="button" variant="primary" disabled={isPulling} onClick={handleUseDetected}>
                Use detected branding
              </Button>
            )}
            <DisabledReasonTooltip reason={blockedReason} side="top">
              <Button
                type="button"
                variant={recentBranding ? 'secondary' : 'primary'}
                disabled={!selectedDomain || isPulling || isCheckingBlockers || !!blockedReason}
                loading={isPulling}
                onClick={handlePull}
              >
                {recentBranding ? 'Pull again' : 'Pull into preview'}
              </Button>
            </DisabledReasonTooltip>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
