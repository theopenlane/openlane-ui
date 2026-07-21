'use client'

import React from 'react'
import { ConfirmGroup } from '../components/confirm-group'
import type { LinkMap } from '../selection-utils'
import type { EditableStepId, LinkableItem } from '../types'

type ConfirmStepProps = {
  platforms: { id: string; name: string; description?: string }[]
  systems: { id: string; name: string; description?: string }[]
  vendors: LinkableItem[]
  assets: LinkableItem[]
  findings: LinkableItem[]
  platformVendorLinks: LinkMap
  systemVendorLinks: LinkMap
  defaultLinkedVendorIds: string[]
  systemsDefaultToPlatformLinks: boolean
  onEditStep: (stepId: EditableStepId) => void
}

export const ConfirmStep = ({
  platforms,
  systems,
  vendors,
  assets,
  findings,
  platformVendorLinks,
  systemVendorLinks,
  defaultLinkedVendorIds,
  systemsDefaultToPlatformLinks,
  onEditStep,
}: ConfirmStepProps) => (
  <div className="space-y-4">
    <p className="text-sm text-muted-foreground">Review everything below before importing it into Openlane. Each section is collapsed by default, expand to see individual entries.</p>
    <ConfirmGroup title="Platforms" items={platforms} vendors={vendors} vendorLinks={platformVendorLinks} defaultLinkedVendorIds={defaultLinkedVendorIds} onEdit={() => onEditStep('platform')} />
    <ConfirmGroup
      title="System Details"
      items={systems}
      vendors={vendors}
      vendorLinks={systemVendorLinks}
      defaultLinkedVendorIds={systemsDefaultToPlatformLinks ? defaultLinkedVendorIds : []}
      onEdit={() => onEditStep('systems')}
    />
    <ConfirmGroup title="Vendors" items={vendors} onEdit={() => onEditStep('vendors')} />
    <ConfirmGroup title="Assets" items={assets} onEdit={() => onEditStep('assets')} />
    <ConfirmGroup title="Findings" items={findings} onEdit={() => onEditStep('findings')} />
  </div>
)
