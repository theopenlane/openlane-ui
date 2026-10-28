import 'server-only'
import { openlaneAPIUrl } from '@repo/dally/auth'
import { type OpenlaneProductsResponse } from '@/types/stripe'

export type TCatalogPrices = ReadonlyMap<string, string>

export const fetchCatalogPrices = async (): Promise<TCatalogPrices> => {
  const res = await fetch(`${openlaneAPIUrl}/v1/products?include_beta=true`, { cache: 'no-store' })

  if (!res.ok) {
    throw new Error(`Failed to load the product catalog (${res.status})`)
  }

  const { modules, addons } = (await res.json()) as OpenlaneProductsResponse
  const entries = [...Object.values(modules ?? {}), ...Object.values(addons ?? {})]

  return new Map(entries.flatMap((entry) => entry.billing.prices.map((price) => [price.price_id, entry.product_id] as const)))
}

export const isSameCatalogProduct = (catalog: TCatalogPrices, fromPriceId: string, toPriceId: string) => {
  const product = catalog.get(fromPriceId)
  return !!product && catalog.get(toPriceId) === product
}
