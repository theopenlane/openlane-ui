'use client'

import React from 'react'
import { Card, CardDescription, CardTitle } from '@repo/ui/cardpanel'
import { Separator } from '@repo/ui/separator'
import { SidebarGroupRow } from './sidebar-group-row'
import type { EditableStepId, LinkableItem } from '../types'

type ScanSummarySidebarProps = {
  platforms: LinkableItem[]
  systems: LinkableItem[]
  vendors: LinkableItem[]
  assets: LinkableItem[]
  findings: LinkableItem[]
  onEditStep: (stepId: EditableStepId) => void
}

export const ScanSummarySidebar = ({ platforms, systems, vendors, assets, findings, onEditStep }: ScanSummarySidebarProps) => (
  <Card>
    <CardTitle className="text-xl py-3">What you&apos;re adding</CardTitle>
    <CardDescription className="pb-3">A live summary of what will be created. Expand a section to see the individual entries, or edit to jump back.</CardDescription>
    <Separator separatorClass="bg-border" />
    <SidebarGroupRow title="Platforms" items={platforms} onEdit={() => onEditStep('platform')} />
    <Separator separatorClass="bg-border" />
    <SidebarGroupRow title="System Details" items={systems} onEdit={() => onEditStep('systems')} />
    <Separator separatorClass="bg-border" />
    <SidebarGroupRow title="Vendors" items={vendors} onEdit={() => onEditStep('vendors')} />
    <Separator separatorClass="bg-border" />
    <SidebarGroupRow title="Assets" items={assets} onEdit={() => onEditStep('assets')} />
    <Separator separatorClass="bg-border" />
    <SidebarGroupRow title="Findings" items={findings} onEdit={() => onEditStep('findings')} />
  </Card>
)
