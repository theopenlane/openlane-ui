'use client'

import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import Link from 'next/link'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { cn } from '@repo/ui/lib/utils'
import { CircleCheck, Clock, ExternalLink, Wand } from 'lucide-react'
import { type BrandFormValues } from '../brand-schema'
import SectionWarning from '../section-warning'
import { useBrandingDomainOptions } from '../helpers/use-branding-domain-options'
import { usePullBrandingFromDomain } from '../helpers/use-pull-branding-from-domain'
import { useBrandingPullWindow } from '../helpers/use-branding-pull-window'

const DOMAIN_SELECT_ID = 'branding-domain-pull-domain'
const ORGANIZATION_SETTINGS_HREF = '/organization-settings/general-settings'
const MANAGE_DOMAINS_TOOLTIP = 'Update the domains available in Organization Settings.'

const PULL_SUMMARY = ['Colors, fonts, logo, and favicon', 'Applies to preview settings only', 'Uploaded assets stay unchanged', 'Nothing goes live until you publish']

interface BrandingDomainPullProps {
  isReadOnly: boolean
  onPulled: () => void
}

export const BrandingDomainPull = ({ isReadOnly, onPulled }: BrandingDomainPullProps) => {
  const [open, setOpen] = useState(false)
  const [pickedDomain, setPickedDomain] = useState('')

  const { formState } = useFormContext<BrandFormValues>()
  const { domainOptions, isLoading } = useBrandingDomainOptions(open)
  const { isPulling, pullBrandingFromDomain } = usePullBrandingFromDomain(onPulled)
  const { isCheckingWindow, runningScanTarget, pullAvailableIn } = useBrandingPullWindow(!isReadOnly)

  const selectedDomain = domainOptions.includes(pickedDomain) ? pickedDomain : (domainOptions[0] ?? '')
  const hasSingleDomain = domainOptions.length === 1

  const blockedReason = pullAvailableIn
    ? `Your organization can run one domain scan an hour. You can pull branding again in ${pullAvailableIn}.`
    : runningScanTarget
      ? `A domain scan for ${runningScanTarget} is already running. We'll let you know when it's done.`
      : null

  const handlePull = async () => {
    if (!selectedDomain) return
    const started = await pullBrandingFromDomain(selectedDomain)
    if (started) {
      setOpen(false)
    }
  }

  if (isReadOnly) return null

  const manageDomainsLink = (
    <SystemTooltip
      content={MANAGE_DOMAINS_TOOLTIP}
      side="top"
      portal
      icon={
        <Link href={ORGANIZATION_SETTINGS_HREF} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary text-xs font-medium underline">
          Manage Domains
          <ExternalLink size={12} />
        </Link>
      }
    />
  )

  const triggerButton = (
    <Button type="button" variant="secondary" icon={<Wand size={16} />} loading={isPulling} disabled={isPulling || isCheckingWindow || !!blockedReason} onClick={() => setOpen(true)}>
      {isPulling ? 'Detecting branding' : 'Detect Branding from Domain'}
    </Button>
  )

  return (
    <>
      {blockedReason ? <SystemTooltip content={blockedReason} icon={<span className="inline-flex">{triggerButton}</span>} /> : triggerButton}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pull branding from domain</DialogTitle>
            <DialogDescription>We&apos;ll import branding from your website into preview settings only.</DialogDescription>
          </DialogHeader>

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

          <ul className="flex flex-col gap-2">
            {PULL_SUMMARY.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm">
                <CircleCheck className="text-primary shrink-0" size={16} />
                {item}
              </li>
            ))}
          </ul>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading domains…</p>
          ) : domainOptions.length === 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">No domain is associated with this organization yet. Add one in Organization Settings, then try again.</p>
              {manageDomainsLink}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={DOMAIN_SELECT_ID} className="text-sm">
                  Domain
                </Label>
                <Select value={selectedDomain} onValueChange={setPickedDomain} disabled={hasSingleDomain}>
                  <SelectTrigger id={DOMAIN_SELECT_ID}>
                    <SelectValue placeholder="Select a domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {domainOptions.map((domain) => (
                      <SelectItem key={domain} value={domain}>
                        {domain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className={cn('flex items-center gap-2', hasSingleDomain ? 'justify-between' : 'justify-end')}>
                  {hasSingleDomain && <p className="text-xs text-muted-foreground">Only one domain available.</p>}
                  {manageDomainsLink}
                </div>
              </div>

              {formState.isDirty && <SectionWarning className="mb-0" message="You have unsaved edits on this page. They will be replaced by the branding we pull." />}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="primary" disabled={!selectedDomain || isPulling || isCheckingWindow || !!blockedReason} loading={isPulling} onClick={handlePull}>
              Pull into preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
