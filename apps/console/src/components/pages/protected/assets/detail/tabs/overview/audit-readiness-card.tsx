'use client'

import React from 'react'
import { ChevronDown, ChevronUp, CircleCheck, CircleHelp, TriangleAlert, type LucideIcon } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import { cn } from '@repo/ui/lib/utils'
import { SkeletonRows } from '@/components/shared/skeleton/skeleton-rows'
import { useOrganization } from '@/hooks/useOrganization'
import { createOrgPersistedStore, parseStringRecord, useOrgPersistedState } from '@/lib/storage/org-persisted-store'
import { isOneOf } from '@/utils/type-guards'
import { type TReadinessAction, type TReadinessCheck } from './readiness-checks'

const GROUPS = [
  { key: 'inventory', label: 'Inventory' },
  { key: 'operating', label: 'Operating effectiveness' },
] as const

const STATE_ICONS = {
  ready: { icon: CircleCheck, className: 'text-success', barClassName: 'bg-success', label: 'Ready' },
  attention: { icon: TriangleAlert, className: 'text-warning', barClassName: 'bg-warning', label: 'Needs attention' },
  unavailable: { icon: CircleHelp, className: 'text-muted-foreground', barClassName: 'bg-muted-foreground/40', label: 'Could not be checked' },
} satisfies Record<TReadinessCheck['state'], { icon: LucideIcon; className: string; barClassName: string; label: string }>

type TCardState = 'expanded' | 'collapsed'
type TExpandPreference = Partial<Record<'complete' | 'incomplete', TCardState>>

const isCardState = isOneOf<TCardState>(['expanded', 'collapsed'])
const NO_PREFERENCE: TExpandPreference = {}
const EXPAND_PREFERENCE_STORE = createOrgPersistedStore<TExpandPreference>(
  'asset-audit-readiness',
  (raw) => parseStringRecord(raw, isCardState),
  () => NO_PREFERENCE,
)

const BAR_STATES: TReadinessCheck['state'][] = ['ready', 'attention', 'unavailable']

type TAuditReadinessCardProps = {
  checks: TReadinessCheck[]
  isLoading: boolean
  availableActions: ReadonlySet<TReadinessAction>
  onAction: (action: TReadinessAction) => void
}

const countPassed = (checks: TReadinessCheck[]) => checks.filter(({ state }) => state === 'ready').length

const ReadinessRow: React.FC<{ check: TReadinessCheck; canAct: boolean; onAction: (action: TReadinessAction) => void }> = ({ check, canAct, onAction }) => {
  const { label, detail, state, action } = check
  const { icon: StateIcon, className, label: stateLabel } = STATE_ICONS[state]
  return (
    <li className="flex flex-wrap items-start gap-3 border-t px-5 py-3">
      <StateIcon size={16} className={cn('mt-0.5 shrink-0', className)} aria-label={stateLabel} />
      <div className="min-w-32 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs break-words text-muted-foreground">{detail}</p>
      </div>
      {action && canAct && (
        <Button type="button" variant="secondary" className="shrink-0" onClick={() => onAction(action.type)}>
          {action.label}
        </Button>
      )}
    </li>
  )
}

const AuditReadinessCard: React.FC<TAuditReadinessCardProps> = ({ checks, isLoading, availableActions, onAction }) => {
  const { currentOrgId } = useOrganization()
  const { value: preference, setValue: setPreference } = useOrgPersistedState(EXPAND_PREFERENCE_STORE, currentOrgId)
  const preferenceKey = countPassed(checks) === checks.length ? 'complete' : 'incomplete'
  const isExpanded = (preference[preferenceKey] ?? (preferenceKey === 'complete' ? 'collapsed' : 'expanded')) === 'expanded'

  if (isLoading) {
    return (
      <Card className="space-y-3 p-5" role="status" aria-label="Loading audit readiness">
        <SkeletonRows count={4} height={36} />
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <h2 className="text-lg font-medium">Audit Readiness</h2>
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <div className="hidden gap-1 xl:flex" aria-hidden>
            {BAR_STATES.flatMap((state) => checks.filter((check) => check.state === state)).map(({ key, state }) => (
              <span key={key} className={cn('h-1.5 w-4 rounded-full', STATE_ICONS[state].barClassName)} />
            ))}
          </div>
          <span className="text-sm">
            {countPassed(checks)} of {checks.length} ready
          </span>
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            icon={isExpanded ? <ChevronUp /> : <ChevronDown />}
            aria-expanded={isExpanded}
            descriptiveTooltipText={isExpanded ? 'Collapse audit readiness' : 'Expand audit readiness'}
            onClick={() => setPreference({ ...preference, [preferenceKey]: isExpanded ? 'collapsed' : 'expanded' })}
          />
        </div>
      </div>
      {isExpanded && (
        <div className="grid grid-cols-1 border-t lg:grid-cols-2">
          {GROUPS.map(({ key, label }) => {
            const groupChecks = checks.filter(({ group }) => group === key)
            return (
              <section key={key} aria-label={label}>
                <div className="flex items-center justify-between px-5 py-2.5 text-xs tracking-wide text-muted-foreground uppercase">
                  <span>{label}</span>
                  <span className="normal-case">
                    {countPassed(groupChecks)} of {groupChecks.length}
                  </span>
                </div>
                <ul>
                  {groupChecks.map((check) => (
                    <ReadinessRow key={check.key} check={check} canAct={!!check.action && availableActions.has(check.action.type)} onAction={onAction} />
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}
    </Card>
  )
}

export default AuditReadinessCard
