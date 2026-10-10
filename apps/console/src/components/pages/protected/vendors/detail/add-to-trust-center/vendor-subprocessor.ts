import { type CreateSubprocessorInput, type EntityQuery } from '@repo/codegen/src/schema'
import { type CustomTypeEnumOption } from '@/lib/graphql-hooks/custom-type-enum'
import { vendorDisplayName } from '@/lib/graphql-hooks/entity'
import { htmlToText } from '@/lib/html/html-to-text'

type TVendor = EntityQuery['entity']

export const vendorSubprocessorName = (vendor: TVendor): string => vendorDisplayName(vendor).trim()

export const vendorSubprocessorDescription = (vendor: TVendor): string => (vendor.description ? htmlToText(vendor.description).trim() : '')

export const toVendorSubprocessorInput = (vendor: TVendor): CreateSubprocessorInput => {
  const description = vendorSubprocessorDescription(vendor)
  return {
    name: vendorSubprocessorName(vendor),
    entityIDs: [vendor.id],
    ...(description && { description }),
    ...(vendor.tags?.length && { tags: vendor.tags }),
  }
}

export const matchVendorCategory = (vendor: TVendor, options: CustomTypeEnumOption[]): string => {
  const services = new Set((vendor.providedServices ?? []).map((service) => service.trim().toLowerCase()))
  return options.find((option) => services.has(option.value.toLowerCase()))?.value ?? ''
}
