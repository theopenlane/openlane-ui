'use client'
import { type Addon, type BillingInterval, type BillingPrice, type Module } from '@/types/stripe'
import { priceForInterval } from '@/lib/billing/product-catalog'
import { useState } from 'react'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { formatDate } from '@/utils/date'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { Box, InfoIcon } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { OPENLANE_WEBSITE_URL } from '@/constants'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { Card } from '@repo/ui/cardpanel'
import { Link } from '@/components/shared/link/link'

const ONLY_ACTIVE_MODULE_REASON = 'You only have one module enabled, you cannot cancel this module. You either need to cancel your subscription or add another module first.'

interface ProductCardProps {
  product: Module | Addon
  currentInterval: BillingInterval | null
  activePriceIds: ReadonlySet<string>
  endingPriceIds: Set<string>
  nextPhaseStart: Date | null
  updating: boolean
  onSubscribe: (priceId: string) => void
  onUnsubscribe: (priceId: string) => void
  isOnlyActiveModule?: boolean
  isSubscriptionCanceled: boolean
}

export const ProductCard = ({
  product,
  currentInterval,
  activePriceIds,
  endingPriceIds,
  nextPhaseStart,
  updating,
  onSubscribe,
  onUnsubscribe,
  isOnlyActiveModule,
  isSubscriptionCanceled,
}: ProductCardProps) => {
  const [confirmSubscribeOpen, setConfirmSubscribeOpen] = useState(false)
  const [confirmUnsubscribeOpen, setConfirmUnsubscribeOpen] = useState(false)
  const [confirmRenewOpen, setConfirmRenewOpen] = useState(false)

  const priceForCurrentInterval = priceForInterval(product, currentInterval)
  const priceId = priceForCurrentInterval?.price_id
  if (!priceForCurrentInterval || !priceId) return null

  const alreadySubscribed = activePriceIds.has(priceId)
  const endingSoon = endingPriceIds.has(priceId)

  const renderPriceOptions = (prices: BillingPrice[]) => {
    const monthly = prices.find((pr) => pr.interval === 'month')
    const yearly = prices.find((pr) => pr.interval === 'year')

    if (!monthly && !yearly) return null

    const savingPct = monthly && yearly ? Math.round(((monthly.unit_amount * 12 - yearly.unit_amount) / (monthly.unit_amount * 12)) * 100) : 0

    return (
      <div className="flex flex-col text-text-paragraph">
        {monthly && (
          <span>
            Monthly: {'$'}
            {monthly.unit_amount / 100}
          </span>
        )}
        {yearly && (
          <span>
            Annual: {'$'}
            {yearly.unit_amount / 100}
            {savingPct > 0 && <span> (save {savingPct}%)</span>}
          </span>
        )}
      </div>
    )
  }

  return (
    <Card className="bg-transparent p-4 mt-5">
      <div className="flex flex-col justify-between flex-1">
        <div className="flex gap-2 w-full">
          <Box size={16} className="mt-2" />
          <div className="flex-1">
            <div className="flex justify-between w-full">
              <div className="flex gap-1 items-center">
                <p className="text-xl font-medium ">{product.display_name}</p>
                <SystemTooltip icon={<InfoIcon size={14} />} content={<div className="flex flex-col gap-1 text-sm text-text-informational">{renderPriceOptions(product.billing.prices)}</div>} />
              </div>
              <div className="flex gap-5 items-center">
                <p>
                  {'$'}
                  {priceForCurrentInterval.unit_amount / 100} / {priceForCurrentInterval.interval}
                </p>

                {alreadySubscribed ? (
                  endingSoon ? (
                    <Button variant="secondary" className="h-8 p-2" disabled={updating || isSubscriptionCanceled} onClick={() => setConfirmRenewOpen(true)}>
                      Renew
                    </Button>
                  ) : (
                    <DisabledReasonTooltip side="top" reason={isOnlyActiveModule ? ONLY_ACTIVE_MODULE_REASON : null}>
                      <Button className="h-8 p-2" variant="destructive" disabled={updating || isOnlyActiveModule || isSubscriptionCanceled} onClick={() => setConfirmUnsubscribeOpen(true)}>
                        Unsubscribe
                      </Button>
                    </DisabledReasonTooltip>
                  )
                ) : (
                  <Button variant="secondary" className="h-8 p-2" disabled={updating || isSubscriptionCanceled} onClick={() => setConfirmSubscribeOpen(true)}>
                    Subscribe
                  </Button>
                )}
              </div>
            </div>
            {(product.marketing_description ?? product.description) && <p className="text-sm text-text-informational mt-1">{product.marketing_description || product.description}</p>}

            <div className="mt-1">
              <Link href={`${OPENLANE_WEBSITE_URL}/pricing`} newTab className="text-sm">
                Learn more
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Renew confirmation */}
      <ConfirmationDialog
        open={confirmRenewOpen}
        onOpenChange={setConfirmRenewOpen}
        onConfirm={() => {
          setConfirmRenewOpen(false)
          onSubscribe(priceId)
        }}
        title={`Renew ${product.display_name}?`}
        description={
          <div className="space-y-2">
            <span>
              <strong>{product.display_name}</strong> will be renewed and remain active on your account. The scheduled cancellation will be revoked.
            </span>
            <span>You will continue to be billed for this module in the next billing cycle.</span>
          </div>
        }
        confirmationText="Confirm"
        confirmationTextVariant="success"
      />

      {/* Subscribe confirmation */}
      <ConfirmationDialog
        open={confirmSubscribeOpen}
        onOpenChange={setConfirmSubscribeOpen}
        onConfirm={() => {
          setConfirmSubscribeOpen(false)
          onSubscribe(priceId)
        }}
        title={`Add ${product.display_name}?`}
        description={
          <div className="space-y-2">
            <span>
              <strong>{product.display_name}</strong> will be added to your account. The change takes effect immediately.
            </span>
            <span>
              {' '}
              <br />
              Your payment will be prorated for the remainder of the current billing cycle.
            </span>
          </div>
        }
        confirmationText="Confirm"
        confirmationTextVariant="success"
      />

      {/* Unsubscribe confirmation */}
      <ConfirmationDialog
        open={confirmUnsubscribeOpen}
        onOpenChange={setConfirmUnsubscribeOpen}
        onConfirm={() => {
          setConfirmUnsubscribeOpen(false)
          onUnsubscribe(priceId)
        }}
        title={`Remove ${product.display_name}?`}
        description={
          <div className="space-y-2">
            <span>
              <strong>{product.display_name}</strong> will be removed from your account at the end of your current billing cycle on <b>{formatDate(nextPhaseStart?.toISOString())}</b>.
            </span>
            <span>After that date, you will no longer have access to this module.</span>
          </div>
        }
        confirmationText="Confirm"
        confirmationTextVariant="destructive"
      />
    </Card>
  )
}
