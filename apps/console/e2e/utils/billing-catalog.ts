import type { Addon, Module, OpenlaneProductsResponse } from '@/types/stripe'

import { API_BASE } from './constants'

export type BillingInterval = 'month' | 'year'
export type CatalogProduct = Module | Addon

export interface BillingCatalog {
  base: CatalogProduct | undefined
  modules: CatalogProduct[]
  addons: CatalogProduct[]
}

const BASE_MODULE_NAME = 'Base Module'

export type CatalogAudience = { includeBeta?: boolean; includePrivate?: boolean }

export const FULL_CATALOG: CatalogAudience = { includeBeta: true, includePrivate: true }

export const fetchBillingCatalog = async ({ includeBeta = false, includePrivate = false }: CatalogAudience = {}): Promise<BillingCatalog> => {
  const params = new URLSearchParams()
  if (includeBeta) params.set('include_beta', 'true')
  if (includePrivate) params.set('include_private', 'true')
  const res = await fetch(`${API_BASE}/v1/products${params.size ? `?${params}` : ''}`)
  if (!res.ok) throw new Error(`GET /v1/products failed: ${res.status}`)

  const { modules, addons } = (await res.json()) as OpenlaneProductsResponse
  const allModules = Object.values(modules ?? {})

  return {
    base: allModules.find((product) => product.display_name === BASE_MODULE_NAME),
    modules: allModules.filter((product) => product.display_name !== BASE_MODULE_NAME),
    addons: Object.values(addons ?? {}),
  }
}

export const allProducts = ({ base, modules, addons }: BillingCatalog): CatalogProduct[] => [...(base ? [base] : []), ...modules, ...addons]

const findPrice = (product: CatalogProduct, interval: BillingInterval) => product.billing.prices.find((price) => price.interval === interval && !!price.price_id)

export const isSwitchable = (product: CatalogProduct): boolean => !!findPrice(product, 'month') && !!findPrice(product, 'year')

export const priceIdFor = (product: CatalogProduct, interval: BillingInterval): string => {
  const priceId = findPrice(product, interval)?.price_id
  if (!priceId) throw new Error(`${product.display_name} has no ${interval} price in core's catalog`)
  return priceId
}

export const switchedPrice = (catalog: BillingCatalog, priceId: string, target: BillingInterval): string => {
  const owner = allProducts(catalog).find((product) => product.billing.prices.some((price) => price.price_id === priceId))
  return owner && isSwitchable(owner) ? priceIdFor(owner, target) : priceId
}

export const pickProducts = (products: CatalogProduct[], count: number, kind: string): CatalogProduct[] => {
  const candidates = products.filter(isSwitchable)
  if (candidates.length < count) {
    throw new Error(`billing e2e needs ${count} ${kind} with monthly and annual prices, core's catalog has ${candidates.length}`)
  }
  return candidates.slice(0, count)
}
