'use client'

import Link from 'next/link'
import { AppWindow, type LucideIcon, Rocket } from 'lucide-react'
import { TrustCenterTrustCenterPreviewStatus } from '@repo/codegen/src/schema'
import { Button } from '@repo/ui/button'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { elementAnchor } from '@/components/shared/element-anchor/element-anchor'
import { StatusLine } from '@/components/shared/status-line/status-line'
import { type TCreateTrustCenterUrls } from './use-create-trust-center-urls'

const NO_EDIT_ACCESS = 'You need edit access to the Trust Center to create its URLs.'
const TAKING_LONG = 'This is taking longer than expected. Please try again later.'

const PREVIEW_STATUS_NOTES: Partial<Record<TrustCenterTrustCenterPreviewStatus, string>> = {
  [TrustCenterTrustCenterPreviewStatus.PROVISIONING]: 'Your preview URL is still being set up and can take a few minutes to start working.',
  [TrustCenterTrustCenterPreviewStatus.FAILED]: 'We could not finish setting up your preview URL. Please contact support.',
}

export const TrustCenterPreviewStatusNote = ({ status }: { status?: TrustCenterTrustCenterPreviewStatus | null }) => {
  const note = status ? PREVIEW_STATUS_NOTES[status] : undefined
  if (!note) return null

  return <p className="text-sm text-muted-foreground">{note}</p>
}

export const CreateTrustCenterUrlsAction = ({ urls }: { urls: TCreateTrustCenterUrls }) => {
  if (urls.isCreating) return <StatusLine>Creating your Trust Center URLs...</StatusLine>

  return (
    <div className="flex flex-col items-center gap-2">
      <DisabledReasonTooltip reason={urls.canCreate || urls.isResolvingAccess ? null : NO_EDIT_ACCESS}>
        <Button type="button" variant="primary" disabled={!urls.canCreate} onClick={urls.create} {...elementAnchor('trust-center', 'create-urls')}>
          Create Trust Center URLs
        </Button>
      </DisabledReasonTooltip>
      {urls.isTakingLong && (
        <p role="status" className="text-sm text-muted-foreground">
          {TAKING_LONG}
        </p>
      )}
    </div>
  )
}

const SetupCard = ({ icon: Icon, heading, description, children }: { icon: LucideIcon; heading: string; description: string; children: React.ReactNode }) => (
  <Card>
    <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
      <Icon size={24} className="text-muted-foreground" aria-hidden />
      <p className="text-base font-medium">{heading}</p>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      {children}
    </CardContent>
  </Card>
)

export const TrustCenterUrlsCard = ({ urls, description }: { urls: TCreateTrustCenterUrls; description: string }) => (
  <SetupCard icon={AppWindow} heading="Set up your Trust Center URLs" description={description}>
    <CreateTrustCenterUrlsAction urls={urls} />
  </SetupCard>
)

export const TrustCenterPublishCard = ({ previewStatus }: { previewStatus?: TrustCenterTrustCenterPreviewStatus | null }) => (
  <SetupCard icon={Rocket} heading="Publish your Trust Center" description="Your preview URL has been created. Your public URL becomes available when you publish.">
    <TrustCenterPreviewStatusNote status={previewStatus} />
    <Button asChild variant="primary">
      <Link href="/trust-center/branding">Review and publish</Link>
    </Button>
  </SetupCard>
)
