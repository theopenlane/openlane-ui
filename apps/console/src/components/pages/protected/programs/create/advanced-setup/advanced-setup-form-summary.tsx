'use client'

import React from 'react'
import { Group, User } from '@repo/codegen/src/schema'
import { Avatar } from '@/components/shared/avatar/avatar'
import { WizardValues } from './advanced-setup-wizard-config'
import { formatDate } from '@/utils/date'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@repo/ui/tooltip'

interface Props {
  summaryData: WizardValues
}

function AvatarListWithTooltip<T>({ items, getKey, getEntity, getName }: { items: T[]; getKey: (item: T) => string; getEntity: (item: T) => User | Group; getName: (item: T) => string }) {
  if (!items.length) return <span className="text-xs text-inverted-muted-foreground">—</span>

  const firstFive = items.slice(0, 5)
  const hasMore = items.length > 5

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex -space-x-2 cursor-pointer">
            {firstFive.map((item) => (
              <Avatar key={getKey(item)} entity={getEntity(item)} className="h-8 w-8 text-sm" />
            ))}
            {hasMore && <div className="h-8 w-8 flex items-center justify-center rounded-full bg-muted text-xs">+{items.length - 5}</div>}
          </div>
        </TooltipTrigger>

        <TooltipContent className="max-h-40 overflow-auto p-2">
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <div key={getKey(item)} className="flex items-center gap-2">
                <Avatar entity={getEntity(item)} className="h-6 w-6 text-xs" />
                <span className="text-xs">{getName(item)}</span>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export const AdvancedSetupFormSummary: React.FC<Props> = ({ summaryData }) => {
  const displaySelection = (items?: { label: string; value: string }[]) => {
    if (!items || items.length === 0) return <span className="text-sm text-inverted-muted-foreground">Empty</span>
    if (items.length === 1) return <span className="text-sm">{items[0].label}</span>
    return <span className="text-sm">Multiple</span>
  }
  return (
    <div className="space-y-3 w-[400px] shrink-0">
      <h3 className="text-base font-medium mb-6">Your Program</h3>

      {/* Basic Information */}
      <div className="rounded-md border border-border bg-card p-4">
        <p className="text-sm font-medium mb-3">Basic Information</p>
        <div className="text-xs space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">
              Type <span className="text-destructive">*</span>
            </span>
            <span className="text-sm text-inverted-muted-foreground">{summaryData.programKindName ?? 'Empty'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">
              Program Name <span className="text-destructive">*</span>
            </span>
            <span className="text-sm text-inverted-muted-foreground">{summaryData.name || 'Empty'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Start Date</span>
            <span className="text-sm text-inverted-muted-foreground">{summaryData.startDate ? formatDate(summaryData.startDate.toISOString()) : 'Empty'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">End Date</span>
            <span className="text-sm text-inverted-muted-foreground">{summaryData.endDate ? formatDate(summaryData.endDate.toISOString()) : 'Empty'}</span>
          </div>
        </div>
      </div>

      {/* Audit Information */}
      <div className="rounded-md border border-border bg-card p-4">
        <p className="text-sm font-medium mb-3">Audit Information</p>
        <div className="text-xs space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Audit Partner</span>
            <span className="text-sm text-inverted-muted-foreground">{summaryData.auditPartnerName || 'Empty'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Audit Firm</span>
            <span className="text-sm text-inverted-muted-foreground">{summaryData.auditFirm || 'Empty'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Audit Partner Email</span>
            <span className="text-sm text-inverted-muted-foreground">{summaryData.auditPartnerEmail || 'Empty'}</span>
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="rounded-md border border-border bg-card p-4">
        <p className="text-sm font-medium mb-3">Team</p>

        {!summaryData.programMembers?.length && !summaryData.programAdmins?.length && !summaryData.editAccessGroups?.length && !summaryData.readOnlyGroups?.length ? (
          <p className="text-xs text-inverted-muted-foreground">Add team members to this program</p>
        ) : (
          <>
            {/* Members / Admins */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Members</p>
                <AvatarListWithTooltip items={summaryData.programMembers || []} getKey={(m) => m.user.id} getEntity={(m) => m.user as unknown as User} getName={(m) => m.user.displayName || '—'} />
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Admins</p>
                <AvatarListWithTooltip items={summaryData.programAdmins || []} getKey={(a) => a.user.id} getEntity={(a) => a.user as unknown as User} getName={(a) => a.user.displayName || '—'} />
              </div>
            </div>

            {/* Groups */}
            <div className="mt-4 grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Groups (Edit Access)</p>
                <AvatarListWithTooltip items={summaryData.editAccessGroups || []} getKey={(g) => g.id} getEntity={(g) => g as unknown as Group} getName={(g) => g.name || '—'} />
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Groups (Read-only Access)</p>
                <AvatarListWithTooltip items={summaryData.readOnlyGroups || []} getKey={(g) => g.id} getEntity={(g) => g as unknown as Group} getName={(g) => g.name || '—'} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Associate Existing Objects */}
      <div className="rounded-md border border-border bg-card p-4">
        <p className="text-sm font-medium mb-3">Associate Existing Objects</p>
        <div className="text-xs space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Associate Existing Risks</span>
            {displaySelection(summaryData.riskIDs)}
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Associate Existing Policies</span>
            {displaySelection(summaryData.internalPolicyIDs)}
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Associate Existing Procedures</span>
            {displaySelection(summaryData.procedureIDs)}
          </div>
        </div>
      </div>
    </div>
  )
}
