'use client'

import React from 'react'
import { ArrowRight, InfoIcon } from 'lucide-react'
import { InfoSlideOut } from '@repo/ui/info-slide-out'
import { Button } from '@repo/ui/button'
import { type IntegrationProvider } from '@/lib/integrations/types'
import { GuideStepGroups, type GuideLiveValues, getProviderSetupGuide } from '@/lib/integrations/setup-guide-content'
import ProviderIcon from './provider-icon'

type IntegrationSetupGuideProps = {
  provider: IntegrationProvider
  /** Credential entry name (e.g. "Slack Bot Token") — picks a connection-specific guide when the provider has more than one */
  connectionLabel?: string
  className?: string
  /** When provided, shows a "Start setup wizard" CTA that closes this panel and hands off to a guided form walkthrough */
  onStartWizard?: () => void
  /** Real values (Principal ARN, generated External ID, etc.) to inline into the guide instead of placeholders */
  liveValues?: GuideLiveValues
}

const IntegrationSetupGuide = ({ provider, connectionLabel, className, onStartWizard, liveValues }: IntegrationSetupGuideProps) => {
  const guide = getProviderSetupGuide(provider, connectionLabel, liveValues)

  if (!guide) {
    return null
  }

  return (
    <InfoSlideOut
      title={`Set up ${provider.displayName}`}
      subtitle={connectionLabel}
      docsUrl={provider.docsUrl || undefined}
      width={660}
      icon={
        <div className="relative aspect-square self-stretch shrink-0 border rounded-full flex items-center justify-center overflow-hidden">
          <ProviderIcon providerName={provider.displayName} logoUrl={provider.logoUrl} className="object-contain w-5 h-5" />
        </div>
      }
      trigger={(open) => (
        <Button
          type="button"
          variant="secondary"
          icon={<InfoIcon />}
          className={className}
          onClick={(e) => {
            e.stopPropagation()
            open()
          }}
        >
          Setup Guide
        </Button>
      )}
    >
      {(close) => (
        <div className="flex flex-col gap-4 pt-1">
          {onStartWizard ? (
            <div className="pb-4 border-b border-border">
              <p className="mb-3 text-xs text-muted-foreground">Ready to enter your values? We can walk you through each field.</p>
              <Button
                type="button"
                icon={<ArrowRight className="h-4 w-4" />}
                onClick={() => {
                  close()
                  // Defer to the next tick — opening the wizard Dialog in the same tick as closing the
                  // Sheet races with Radix's outside-click dismissal and can close the Dialog right back.
                  setTimeout(() => onStartWizard(), 0)
                }}
              >
                Start setup wizard
              </Button>
            </div>
          ) : null}
          {guide.intro ? <p className="text-sm text-muted-foreground">{guide.intro}</p> : null}
          <GuideStepGroups guide={guide} />
        </div>
      )}
    </InfoSlideOut>
  )
}

export default IntegrationSetupGuide
