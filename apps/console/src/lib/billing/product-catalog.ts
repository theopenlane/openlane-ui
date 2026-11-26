import { openlaneAPIUrl } from '@repo/dally/auth'
import { type Addon, type BillingInterval, type Module, type OpenlaneProductsResponse } from '@/types/stripe'

export type TCatalogAudience = {
  includeBeta?: boolean
  includePrivate?: boolean
}

export const PURCHASABLE_CATALOG: TCatalogAudience = { includeBeta: true }

export const FULL_CATALOG: TCatalogAudience = { includeBeta: true, includePrivate: true }

export const productCatalogUrl = ({ includeBeta = false, includePrivate = false }: TCatalogAudience = {}): string => {
  const params = new URLSearchParams()
  if (includeBeta) params.set('include_beta', 'true')
  if (includePrivate) params.set('include_private', 'true')
  const query = params.toString()
  return `${openlaneAPIUrl}/v1/products${query ? `?${query}` : ''}`
}

export const catalogProducts = (catalog: OpenlaneProductsResponse): (Module | Addon)[] => [...Object.values(catalog.modules ?? {}), ...Object.values(catalog.addons ?? {})]

export const catalogPriceIds = (catalog: OpenlaneProductsResponse): Set<string> =>
  new Set(catalogProducts(catalog).flatMap((product) => product.billing.prices.flatMap((price) => (price.price_id ? [price.price_id] : []))))

const BASE_MODULE_LOOKUP_KEY = 'base_module'

export const isBaseModule = (product: Module | Addon): boolean => product.lookup_key === BASE_MODULE_LOOKUP_KEY

export const priceForInterval = (product: Module | Addon, interval: BillingInterval | null) => product.billing.prices.find((price) => price.interval === interval)

export const isProductActive = (product: Module | Addon, interval: BillingInterval | null, activePriceIds: ReadonlySet<string>): boolean => {
  const priceId = priceForInterval(product, interval)?.price_id
  return !!priceId && activePriceIds.has(priceId)
}
