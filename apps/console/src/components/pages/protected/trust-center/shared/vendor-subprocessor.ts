import { type CreateSubprocessorInput, type CreateSubprocessorMutationVariables, type EntityQuery } from '@repo/codegen/src/schema'
import { type CustomTypeEnumOption } from '@/lib/graphql-hooks/custom-type-enum'
import { vendorDisplayName } from '@/lib/graphql-hooks/entity'
import { htmlToText } from '@/lib/html/html-to-text'
import { type TVendorSubprocessorCandidate } from '@/lib/graphql-hooks/subprocessor'
import { fetchLogoAsFile, getVendorLogoUrl } from '@/lib/vendor-logo'

type TSubprocessorVendor = Pick<TVendorSubprocessorCandidate | EntityQuery['entity'], 'id' | 'name' | 'displayName' | 'description' | 'tags' | 'providedServices' | 'logoFile'>

export const vendorSubprocessorName = (vendor: TSubprocessorVendor): string => vendorDisplayName(vendor).trim()

export const vendorSubprocessorDescription = (vendor: TSubprocessorVendor): string => (vendor.description ? htmlToText(vendor.description).trim() : '')

type TVendorLinkOption = { linkVendor: boolean }

const toVendorSubprocessorInput = (vendor: TSubprocessorVendor, { linkVendor }: TVendorLinkOption): CreateSubprocessorInput => {
  const description = vendorSubprocessorDescription(vendor)
  return {
    name: vendorSubprocessorName(vendor),
    ...(linkVendor && { entityIDs: [vendor.id] }),
    ...(description && { description }),
    ...(vendor.tags?.length && { tags: vendor.tags }),
  }
}

export const toVendorSubprocessorVariables = async (vendor: TSubprocessorVendor, options: TVendorLinkOption): Promise<CreateSubprocessorMutationVariables> => {
  const logoUrl = getVendorLogoUrl(vendor.logoFile)
  return { input: toVendorSubprocessorInput(vendor, options), logoFile: logoUrl ? await fetchLogoAsFile(logoUrl) : undefined }
}

export const matchVendorCategory = (vendor: TSubprocessorVendor, options: CustomTypeEnumOption[]): string => {
  const services = new Set((vendor.providedServices ?? []).map((service) => service.trim().toLowerCase()))
  return options.find((option) => services.has(option.value.toLowerCase()))?.value ?? ''
}

export type TSubprocessorRef = { id: string; name: string }

export type TVendorSubprocessorMatches = {
  listed?: TSubprocessorRef | null
  linked?: TSubprocessorRef | null
  ownSameName?: TSubprocessorRef | null
  catalogSameName?: TSubprocessorRef | null
}

export type TReusedSubprocessorTarget = { kind: 'linked' | 'own' | 'catalog'; subprocessor: TSubprocessorRef }

export type TVendorSubprocessorTarget = { kind: 'listed'; subprocessor: TSubprocessorRef } | TReusedSubprocessorTarget | { kind: 'new' }

export const resolveVendorSubprocessorTarget = ({ listed, linked, ownSameName, catalogSameName }: TVendorSubprocessorMatches): TVendorSubprocessorTarget => {
  if (listed) return { kind: 'listed', subprocessor: listed }
  if (linked) return { kind: 'linked', subprocessor: linked }
  if (ownSameName) return { kind: 'own', subprocessor: ownSameName }
  if (catalogSameName) return { kind: 'catalog', subprocessor: catalogSameName }
  return { kind: 'new' }
}

export const needsVendorLink = (target: TVendorSubprocessorTarget): boolean => target.kind === 'own'
