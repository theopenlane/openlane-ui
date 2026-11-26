import { openlaneAPIUrl } from '@repo/dally/auth'
import { type TCatalogAudience } from './product-catalog'

export const productCatalogUrl = ({ includeBeta = false, includePrivate = false }: TCatalogAudience = {}): string => {
  const params = new URLSearchParams()
  if (includeBeta) params.set('include_beta', 'true')
  if (includePrivate) params.set('include_private', 'true')
  const query = params.toString()
  return `${openlaneAPIUrl}/v1/products${query ? `?${query}` : ''}`
}
