'use client'

import React from 'react'
import { PanelTop, Settings, SlidersHorizontal } from 'lucide-react'
import { Button } from '@repo/ui/button'
import Menu from '@/components/shared/menu/menu'
import { MenuActionItem } from '@/components/shared/menu/menu-action-item'
import { elementAnchor } from '@/components/shared/element-anchor/element-anchor'
import { useOrganizationVendorScoringConfig } from '@/lib/graphql-hooks/vendor-scoring-config'
import { useVendorScoringDisplay } from './use-vendor-scoring-display'

const MENU_ANCHOR = elementAnchor('vendor', 'scoring', 'menu')

export const VendorScoringMenu = () => {
  const { isCollapsed, expand, openConfiguration } = useVendorScoringDisplay()
  const { isConfigured } = useOrganizationVendorScoringConfig()

  if (!isCollapsed) return null

  return (
    <Menu
      triggerAnchor={MENU_ANCHOR}
      trigger={<Button type="button" variant="secondary" size="icon-sm" icon={<Settings size={16} />} descriptiveTooltipText="Risk scoring" />}
      content={
        <>
          <MenuActionItem
            action={{ key: 'configure', label: 'Configure risk scoring', icon: <SlidersHorizontal size={16} />, onClick: openConfiguration, anchor: elementAnchor('vendor', 'scoring', 'configure') }}
          />
          <MenuActionItem
            action={{
              key: 'show',
              label: isConfigured ? 'Show risk summary' : 'Show scoring banner',
              icon: <PanelTop size={16} />,
              onClick: expand,
              anchor: elementAnchor('vendor', 'scoring', 'show-summary'),
            }}
          />
        </>
      }
    />
  )
}
