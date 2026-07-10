'use client'

import React from 'react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { useRouter } from 'next/navigation'
import { type AvailableIntegrationNode } from '@/lib/integrations/types'
import IntegrationCardShell from './integration-card-shell'

type AvailableIntegrationCardProps = {
  integration: AvailableIntegrationNode
  canManage: boolean
}

const AvailableIntegrationCard = ({ integration, canManage }: AvailableIntegrationCardProps) => {
  const router = useRouter()
  const provider = integration.provider
  const isComingSoon = !provider.active

  const handleClick = () => {
    if (isComingSoon) {
      return
    }

    router.push(`/automation/integrations/${provider.id}`)
  }

  return (
    <IntegrationCardShell
      logoUrl={provider.logoUrl}
      docsUrl={integration.docsUrl}
      displayName={integration.name}
      tags={integration.tags}
      tagLabelOverrides={integration.supportsPrimaryDirectory ? { directory: 'primary directory' } : undefined}
      description={integration.description || 'Connect to keep your workflows connected and risks actionable.'}
      headerBadge={
        isComingSoon ? (
          <Badge variant="outline" className="absolute left-0 top-0 h-6 px-2 text-[10px] uppercase tracking-[0.05em] text-muted-foreground">
            Coming Soon
          </Badge>
        ) : null
      }
      titleExtra={
        integration.installedCount > 0 ? (
          <Badge variant="outline" className="shrink-0 text-[10px] uppercase tracking-[0.05em]">
            {integration.installedCount} {integration.installedCount === 1 ? 'instance' : 'instances'}
          </Badge>
        ) : null
      }
      footer={
        <Button className="w-full text-brand" variant="secondary" onClick={handleClick} disabled={isComingSoon}>
          {isComingSoon ? 'Coming Soon' : canManage && integration.installedCount > 0 ? 'Manage' : 'View'}
        </Button>
      }
    />
  )
}

export default AvailableIntegrationCard
