import 'server-only'
import { type OpenlaneProductsResponse } from '@/types/stripe'
import { coreFetch } from '@/lib/server/core-fetch'
import { type TCatalogAudience } from '@/lib/billing/product-catalog'
import { productCatalogUrl } from '@/lib/billing/product-catalog-url'

export const fetchCatalog = async (audience: TCatalogAudience): Promise<OpenlaneProductsResponse> => {
  const res = await coreFetch(productCatalogUrl(audience), { cache: 'no-store' })

  if (!res.ok) {
    throw new Error(`Failed to load the product catalog (${res.status})`)
  }

  return (await res.json()) as OpenlaneProductsResponse
}
