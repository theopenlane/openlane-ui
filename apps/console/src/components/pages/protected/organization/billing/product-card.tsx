'use client'
import { Card } from '@repo/ui/cardpanel'
import { Button } from '@repo/ui/button'
import { formatDate } from '@/utils/date'
import { Price } from '@/types/stripe'

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
}

export function ProductCard({ product, currentInterval, activePriceIds, endingPriceIds, nextPhaseStart, updating, onSubscribe, onUnsubscribe }: ProductCardProps) {
  const priceForCurrentInterval = product.billing.prices.find((pr) => pr.interval === currentInterval)
  if (!priceForCurrentInterval) return null

  const alreadySubscribed = activePriceIds.has(priceForCurrentInterval.price_id)

  return (
    <Card key={product.product_id} className="p-6 flex flex-col justify-between max-w-[300px]">
      <div className="flex flex-col justify-between flex-1">
        <div>
          <p className="text-xl font-medium mb-2">{product.display_name}</p>
          {(product.marketing_description ?? product.description) && <p className="text-sm ">{product.marketing_description || product.description}</p>}
          <div className="mt-2 flex flex-col gap-1 text-sm ">
            {product.billing.prices.map((pr) => (
              <span key={pr.price_id}>
                ${pr.unit_amount / 100} / {pr.interval}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-3 flex justify-center">
          {alreadySubscribed ? (
            endingPriceIds.has(priceForCurrentInterval.price_id) ? (
              <Button disabled>Ends at {formatDate(nextPhaseStart?.toISOString())}</Button>
            ) : (
              <Button variant="destructive" disabled={updating} onClick={() => onUnsubscribe(priceForCurrentInterval.price_id)}>
                Cancel
              </Button>
            )
          ) : (
            <Button disabled={updating} onClick={() => onSubscribe(priceForCurrentInterval.price_id)}>
              Subscribe
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
