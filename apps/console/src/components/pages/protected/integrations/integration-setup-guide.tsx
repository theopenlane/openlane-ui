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
  connectionLabel?: string
  className?: string
  onStartWizard?: () => void
  liveValues?: GuideLiveValues
  onOpen?: () => void
}

const IntegrationSetupGuide = ({ provider, connectionLabel, className, onStartWizard, liveValues, onOpen }: IntegrationSetupGuideProps) => {
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
            onOpen?.()
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
