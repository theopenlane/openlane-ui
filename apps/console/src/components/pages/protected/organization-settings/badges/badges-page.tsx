'use client'

import React, { use, useEffect } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import EmptyTabState from '@/components/shared/crud-base/tabs/empty-tab-state'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { SocBadgePanel } from '@/components/shared/soc-badge/soc-badge-panel'
import { SOC_BADGE_DESCRIPTION, SOC_BADGE_TITLE, isSocBadgeConfigured } from '@/components/shared/soc-badge/soc-badge-config'
import { useSocBadgeAvailability } from '@/lib/graphql-hooks/soc-badge'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'

const BADGES_HREF = '/organization-settings/badges'

const BadgesPage: React.FC = () => {
  const { setCrumbs } = use(BreadcrumbContext)
  const { isAvailable, isPending, isError, error } = useSocBadgeAvailability()

  useQueryErrorNotification({ error, description: 'Failed to load badge eligibility' })

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Organization Settings', href: '/organization-settings/general-settings' },
      { label: 'Badges', href: BADGES_HREF },
    ])
  }, [setCrumbs])

  const renderContent = () => {
    if (!isSocBadgeConfigured) {
      return <EmptyTabState title="Badges aren't set up" description="The AICPA SOC logo images haven't been configured for this environment." />
    }

    if (isPending) {
      return (
        <div role="status" aria-live="polite" aria-label="Loading badges" className="flex max-w-3xl flex-col gap-3">
          <Skeleton height={20} className="w-full max-w-[240px] rounded-md" />
          <Skeleton height={14} className="w-full max-w-[420px] rounded-md" />
          <Skeleton height={160} className="w-full rounded-lg" />
        </div>
      )
    }

    if (isError) {
      return <EmptyTabState title="Couldn't check badge eligibility" description="Please try again later." />
    }

    if (!isAvailable) {
      return (
        <EmptyTabState
          title="No badges available yet"
          description="The AICPA SOC badge becomes available once SOC 2 is enabled in your Trust Center, or once at least one SOC 2 control is past Not Implemented."
        />
      )
    }

    return (
      <Panel className="max-w-3xl">
        <PanelHeader heading={SOC_BADGE_TITLE} subheading={SOC_BADGE_DESCRIPTION} noBorder />
        <SocBadgePanel />
      </Panel>
    )
  }

  return (
    <>
      <PageHeading eyebrow="Organization Settings" heading="Badges" />
      {renderContent()}
    </>
  )
}

export default BadgesPage
