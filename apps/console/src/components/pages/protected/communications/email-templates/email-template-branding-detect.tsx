'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import type { RJSFSchema } from '@rjsf/utils'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { ArrowLeft, Wand } from 'lucide-react'
import { Callout } from '@/components/shared/callout/callout'
import { StatusLine } from '@/components/shared/status-line/status-line'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { DomainSelectField } from '@/components/shared/domain-branding/domain-select-field'
import { getDomainScanBlockedReason, NO_DOMAIN_REASON } from '@/components/shared/domain-branding/domain-scan-blocked-reason'
import { useOrganizationDomainOptions } from '@/components/shared/domain-branding/use-organization-domain-options'
import { useDomainScanWindow } from '@/components/shared/domain-branding/use-domain-scan-window'
import { useDomainBrandingScan } from '@/components/shared/domain-branding/use-domain-branding-scan'
import { useRecentDomainBranding } from '@/components/shared/domain-branding/use-recent-domain-branding'
import type { ScanBranding } from '@/components/pages/protected/scans/detail/openlane-domain-scan/scan-metadata'
import { useNotification } from '@/hooks/useNotification'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { hasPermission, isImpersonation } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { formatTimeSince } from '@/utils/date'
import { buildEmailBrandingReview, type TEmailBrandingReview, type TEmailBrandingSuggestion } from './email-template-branding'
import { EmailTemplateBrandingReview } from './email-template-branding-review'

const DOMAIN_SELECT_ID = 'email-template-branding-domain'
const NO_SCAN_PERMISSION_REASON = "You don't have permission to run domain scans. Ask an organization admin to detect branding."

interface EmailTemplateBrandingDetectProps {
  schema: RJSFSchema
  onApply: (suggestions: TEmailBrandingSuggestion[]) => void
}

export const EmailTemplateBrandingDetect: React.FC<EmailTemplateBrandingDetectProps> = ({ schema, onApply }) => {
  const [open, setOpen] = useState(false)
  const [pickedDomain, setPickedDomain] = useState('')
  const [review, setReview] = useState<TEmailBrandingReview | null>(null)

  const openRef = useRef(open)

  useEffect(() => {
    openRef.current = open
  }, [open])

  const { data: session } = useSession()
  const { successNotification } = useNotification()
  const { data: orgPermission, isPending: isPermissionPending } = useOrganizationRoles()
  const { domainOptions, isLoadingDomains, refetchDomains } = useOrganizationDomainOptions(true)
  const { isCheckingWindow, scanHistoryUnavailable, runningScanTarget, availableIn } = useDomainScanWindow(open)
  const { recentBrandingByDomain, isLoadingRecentBranding } = useRecentDomainBranding({ domains: domainOptions, enabled: open, isScanRunning: !!runningScanTarget })

  const startReview = (branding: ScanBranding, domain: string) => setReview(buildEmailBrandingReview(branding, domain, schema))

  const handleBrandingFound = (branding: ScanBranding, domain: string) => {
    startReview(branding, domain)
    if (!openRef.current) {
      successNotification({ title: 'Branding detected', description: `Select Review Detected Branding to apply the colors from ${domain}.` })
    }
  }

  const { isDetecting, detectingDomain, detectBranding } = useDomainBrandingScan({ onBrandingFound: handleBrandingFound })

  const selectedDomain = domainOptions.includes(pickedDomain) ? pickedDomain : (domainOptions[0] ?? '')
  const recentBranding = recentBrandingByDomain.get(selectedDomain)
  const hasDomains = domainOptions.length > 0
  const isCheckingPermission = !isImpersonation(session) && isPermissionPending
  const canCreateScan = hasPermission(orgPermission?.roles, AccessEnum.CanCreateScan, session)
  const isCheckingBlockers = isCheckingWindow || isLoadingDomains || isLoadingRecentBranding || isCheckingPermission
  const scanBlockedReason =
    !isCheckingPermission && !canCreateScan
      ? NO_SCAN_PERMISSION_REASON
      : getDomainScanBlockedReason({ isChecking: isCheckingBlockers, scanHistoryUnavailable, hasDomains, availableIn, runningScanTarget }, 'detect branding')
  const triggerBlockedReason = !isLoadingDomains && !hasDomains ? NO_DOMAIN_REASON : null
  const hasPendingReview = !!review && !open

  const handleToggle = (field: string, selected: boolean) => {
    setReview((current) => current && { ...current, suggestions: current.suggestions.map((suggestion) => (suggestion.field === field ? { ...suggestion, selected } : suggestion)) })
  }

  const handleApply = () => {
    if (!review) return
    onApply(review.suggestions)
    successNotification({ title: 'Branding applied', description: `Colors from ${review.domain} were applied. Check the preview, then save the template.` })
    setReview(null)
    setOpen(false)
  }

  const selectedCount = review?.suggestions.filter((suggestion) => suggestion.selected).length ?? 0

  return (
    <>
      <DisabledReasonTooltip reason={triggerBlockedReason}>
        <Button
          type="button"
          variant="secondary"
          icon={<Wand size={16} />}
          loading={isDetecting}
          disabled={isLoadingDomains || !!triggerBlockedReason}
          onClick={() => {
            refetchDomains()
            setOpen(true)
          }}
        >
          {hasPendingReview ? 'Review Detected Branding' : isDetecting ? 'Detecting branding' : 'Detect Branding from Domain'}
        </Button>
      </DisabledReasonTooltip>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{review ? 'Apply detected branding' : 'Detect branding from domain'}</DialogTitle>
            <DialogDescription>
              {review
                ? `Choose which colors from ${review.domain} to use in this template. Nothing is saved until you save the template.`
                : "We'll read the colors and logo from your website. Your Trust Center is not changed."}
            </DialogDescription>
          </DialogHeader>

          {review ? (
            <EmailTemplateBrandingReview review={review} onToggle={handleToggle} />
          ) : (
            <>
              <DomainSelectField id={DOMAIN_SELECT_ID} domains={domainOptions} value={selectedDomain} onValueChange={setPickedDomain} disabled={isDetecting} />
              {isDetecting ? (
                <StatusLine>{`Detecting branding from ${detectingDomain ?? selectedDomain}. This can take a few minutes.`}</StatusLine>
              ) : (
                recentBranding && (
                  <Callout variant="plain">{`Branding for ${selectedDomain} was detected ${formatTimeSince(recentBranding.scannedAt)}. You can use it without running a new scan.`}</Callout>
                )
              )}
            </>
          )}

          <DialogFooter>
            {review ? (
              <>
                <Button type="button" variant="secondary" icon={<ArrowLeft size={16} />} iconPosition="left" onClick={() => setReview(null)}>
                  Back
                </Button>
                <Button type="button" variant="primary" disabled={selectedCount === 0} onClick={handleApply}>
                  Apply to template
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  {isDetecting ? 'Close' : 'Cancel'}
                </Button>
                {recentBranding && !isDetecting && (
                  <Button type="button" variant="secondary" onClick={() => startReview(recentBranding.branding, selectedDomain)}>
                    Use detected branding
                  </Button>
                )}
                <DisabledReasonTooltip reason={scanBlockedReason} side="top">
                  <Button type="button" variant="primary" disabled={isDetecting || isCheckingBlockers || !!scanBlockedReason} loading={isDetecting} onClick={() => detectBranding(selectedDomain)}>
                    {recentBranding ? 'Detect again' : 'Detect branding'}
                  </Button>
                </DisabledReasonTooltip>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
