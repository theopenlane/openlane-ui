'use client'
import { Card } from '@repo/ui/cardpanel'
import { Button } from '@repo/ui/button'
import { Price } from '@/types/stripe'
import { useState } from 'react'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { formatDate } from '@/utils/date'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'

type Product = {
  product_id: string
  display_name: string
  description?: string
  marketing_description?: string
  billing: {
    prices: {
      price_id: string
      interval: 'day' | 'week' | 'month' | 'year' | null
      unit_amount: number
    }[]
  }
}

interface ProductCardProps {
  product: Product
  currentInterval: 'day' | 'week' | 'month' | 'year' | null
  activePriceIds: Set<string | Price>
  endingPriceIds: Set<string>
  nextPhaseStart: Date | null
  updating: boolean
  onSubscribe: (priceId: string) => void
  onUnsubscribe: (priceId: string) => void
  isOnlyActiveModule?: boolean
}

export function ProductCard({ product, currentInterval, activePriceIds, endingPriceIds, nextPhaseStart, updating, onSubscribe, onUnsubscribe, isOnlyActiveModule }: ProductCardProps) {
  const [confirmSubscribeOpen, setConfirmSubscribeOpen] = useState(false)
  const [confirmUnsubscribeOpen, setConfirmUnsubscribeOpen] = useState(false)
  const [confirmRenewOpen, setConfirmRenewOpen] = useState(false)

  const priceForCurrentInterval = product.billing.prices.find((pr) => pr.interval === currentInterval)
  if (!priceForCurrentInterval) return null

  const oppositeInterval = currentInterval === 'month' ? 'year' : currentInterval === 'year' ? 'month' : null
  const priceForOppositeInterval = product.billing.prices.find((pr) => pr.interval === oppositeInterval)

  const alreadySubscribed = activePriceIds.has(priceForCurrentInterval.price_id)

  return (
    <>
      <Card key={product.product_id} className="p-6 flex flex-col justify-between max-w-[300px]">
        <div className="flex flex-col justify-between flex-1">
          <div>
            <p className="text-xl font-medium mb-2">{product.display_name}</p>
            {(product.marketing_description ?? product.description) && <p className="text-sm">{product.marketing_description || product.description}</p>}
            <div className="flex gap-2 items-center">
              <p className="mt-2 text-sm text-text-informational">
                ${priceForCurrentInterval.unit_amount / 100} / {priceForCurrentInterval.interval}
              </p>
              {priceForOppositeInterval && (
                <SystemTooltip
                  icon={<InfoIcon size={14} className="mt-2 text-brand-100" />}
                  content={
                    <p>
                      ${priceForOppositeInterval.unit_amount / 100} / {priceForOppositeInterval.interval}
                    </p>
                  }
                />
              )}{' '}
            </div>
          </div>

          <div className="mt-3 flex justify-center">
            {alreadySubscribed ? (
              endingPriceIds.has(priceForCurrentInterval.price_id) ? (
                <Button disabled={updating} onClick={() => setConfirmRenewOpen(true)}>
                  Renew
                </Button>
              ) : (
                <Button variant="destructive" disabled={updating || isOnlyActiveModule} onClick={() => setConfirmUnsubscribeOpen(true)}>
                  Unsubscribe
                </Button>
              )
            ) : (
              <Button disabled={updating} onClick={() => setConfirmSubscribeOpen(true)}>
                Subscribe
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Renew confirmation */}
      <ConfirmationDialog
        open={confirmRenewOpen}
        onOpenChange={setConfirmRenewOpen}
        onConfirm={() => {
          setConfirmRenewOpen(false)
          onSubscribe(priceForCurrentInterval.price_id)
        }}
        title={`Renew ${product.display_name}?`}
        description={
          <>
            <p>
              <strong>{product.display_name}</strong> will be renewed and remain active on your account. The scheduled cancellation will be revoked.
            </p>
            <p>You will continue to be billed for this module in the next billing cycle.</p>
          </>
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
          onSubscribe(priceForCurrentInterval.price_id)
        }}
        title={`Add ${product.display_name}?`}
        description={
          <>
            <p>
              <strong>{product.display_name}</strong> will be added to your account. The change takes effect immediately.
            </p>
            <p>Your payment will be prorated for the remainder of the current billing cycle.</p>
          </>
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
          onUnsubscribe(priceForCurrentInterval.price_id)
        }}
        title={`Remove ${product.display_name}?`}
        description={
          <>
            <p>
              <strong>{product.display_name}</strong> will be removed from your account at the end of your current billing cycle on <b>{formatDate(nextPhaseStart?.toISOString())}</b>.
            </p>
            <p>After that date, you will no longer have access to this module.</p>
          </>
        }
        confirmationText="Confirm"
        confirmationTextVariant="destructive"
      />
    </>
  )
}
