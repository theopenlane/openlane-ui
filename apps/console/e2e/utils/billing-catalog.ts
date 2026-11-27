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

export const fetchBillingCatalog = async (): Promise<BillingCatalog> => {
  const res = await fetch(`${API_BASE}/v1/products`)
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

const findPrice = (product: CatalogProduct, interval: BillingInterval) => product.billing.prices.find((price) => price.interval === interval)

export const isSwitchable = (product: CatalogProduct): boolean => !!findPrice(product, 'month') && !!findPrice(product, 'year')

export const priceIdFor = (product: CatalogProduct, interval: BillingInterval): string => {
  const price = findPrice(product, interval)
  if (!price) throw new Error(`${product.display_name} has no ${interval} price in core's catalog`)
  return price.price_id
}

export const pickProducts = (products: CatalogProduct[], count: number, kind: string): CatalogProduct[] => {
  const candidates = products.filter(isSwitchable)
  if (candidates.length < count) {
    throw new Error(`billing e2e needs ${count} ${kind} with monthly and annual prices, core's catalog has ${candidates.length}`)
  }
  return candidates.slice(0, count)
}
