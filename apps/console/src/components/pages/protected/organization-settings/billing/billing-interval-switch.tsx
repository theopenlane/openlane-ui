import React, { useMemo, useState } from 'react'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { findManageableSchedule, useSwitchIntervalMutation } from '@/lib/query-hooks/stripe'
import { useNotification } from '@/hooks/useNotification'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import {
  intervalAdjective,
  intervalSwitchBlockedReason,
  oppositeInterval,
  planIntervalSwitch,
  scheduleSwitchBlockedReason,
  SWITCH_UNAVAILABLE_REASON,
  switchingPriceIds,
} from '@/lib/billing/interval-switch'
import { type BillingInterval, type OpenlaneProductsResponse, type SubscriptionSchedulesResponse } from '@/types/stripe'
import { billingIntervalStyles } from './billing-settings.styles'

type TBillingIntervalSwitchProps = {
  catalog: OpenlaneProductsResponse | undefined
  schedules: SubscriptionSchedulesResponse
  currentInterval: BillingInterval | null
  isTrialing: boolean
}

const CATALOG_UNAVAILABLE_REASON = "Billing details couldn't be loaded. Please try again later."

const INTERVAL_OPTIONS: readonly { value: BillingInterval; label: string }[] = [
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Annual (15% off)' },
]

const BillingIntervalSwitch = ({ catalog, schedules, currentInterval, isTrialing }: TBillingIntervalSwitchProps) => {
  const { toggle, option } = billingIntervalStyles()
  const { errorNotification, successNotification } = useNotification()
  const { mutateAsync: switchInterval, isPending: switching } = useSwitchIntervalMutation()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const schedule = findManageableSchedule(schedules)
  const targetInterval = currentInterval ? oppositeInterval(currentInterval) : null

  const blockedReason = useMemo(() => {
    const scheduleReason = scheduleSwitchBlockedReason(schedule)
    if (scheduleReason || !schedule?.current_phase || !targetInterval) return scheduleReason ?? SWITCH_UNAVAILABLE_REASON
    if (!catalog) return CATALOG_UNAVAILABLE_REASON
    return intervalSwitchBlockedReason(planIntervalSwitch(catalog, switchingPriceIds(schedule.phases, schedule.current_phase), targetInterval), targetInterval)
  }, [schedule, catalog, targetInterval])

  const handleSwitch = async () => {
    if (!schedule || !targetInterval) return

    try {
      await switchInterval({ scheduleId: schedule.id, interval: targetInterval })
      successNotification({
        title: 'Interval switched',
        description: 'Your billing interval has been updated.',
      })
    } catch (err) {
      errorNotification({
        title: 'Switch failed',
        description: err instanceof Error ? err.message : 'Unable to switch billing interval.',
      })
    }
  }

  return (
    <div className="flex gap-3 items-center p-4 pt-5">
      <span className="font-medium text-base w-28">Billing interval</span>
      <div className={toggle()} role="group" aria-label="Billing interval">
        {INTERVAL_OPTIONS.map(({ value, label }) => (
          <DisabledReasonTooltip key={value} reason={currentInterval === value ? null : blockedReason}>
            <button
              type="button"
              aria-pressed={currentInterval === value}
              disabled={switching || !!blockedReason || currentInterval === value}
              onClick={() => setConfirmOpen(true)}
              className={option({ active: currentInterval === value })}
            >
              {label}
            </button>
          </DisabledReasonTooltip>
        ))}
      </div>
      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={() => {
          setConfirmOpen(false)
          handleSwitch()
        }}
        title={targetInterval ? `Switch to ${intervalAdjective(targetInterval)} billing?` : 'Switch billing interval?'}
        description={
          currentInterval &&
          targetInterval && (
            <span className="block space-y-2">
              <span className="block">
                Your subscription will switch from <strong>{intervalAdjective(currentInterval)}</strong> to <strong>{intervalAdjective(targetInterval)}</strong> billing.
              </span>
              <span className="block">
                {isTrialing
                  ? `The change applies now. Your trial continues, and your first ${intervalAdjective(targetInterval)} charge is made when it ends.`
                  : 'The change takes effect immediately: your billing date moves to today, unused time on your current plan is credited, and you are invoiced for the new period.'}
              </span>
            </span>
          )
        }
        confirmationText="Confirm"
        confirmationTextVariant="success"
      />
    </div>
  )
}

export default BillingIntervalSwitch
