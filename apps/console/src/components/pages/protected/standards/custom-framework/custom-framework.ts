import { type ControlWhereInput, type StandardWhereInput } from '@repo/codegen/src/schema'
import { orgAbbreviation } from '@/utils/strings'
import { toBase64DataUri } from '@/lib/image-utils'
import { ORG_MANAGED_CONTROLS_WHERE } from '@/constants/standards'

export const CUSTOM_STANDARDS_WHERE: StandardWhereInput = { or: [{ systemOwned: false }, { systemOwnedIsNil: true }] }

export const OPENLANE_STANDARDS_WHERE: StandardWhereInput = { systemOwned: true }

export const STANDARD_OWN_CONTROLS_WHERE: ControlWhereInput = { or: [{ ownerIDIsNil: true }, { hasStandardWith: [CUSTOM_STANDARDS_WHERE] }] }

export const UNLINKED_CUSTOM_CONTROLS_WHERE: ControlWhereInput = { and: [ORG_MANAGED_CONTROLS_WHERE, { standardIDIsNil: true }] }

export const STANDARDS_CATALOG_HREF = '/standards'

export const CUSTOM_FRAMEWORK_CREATE_HREF = `${STANDARDS_CATALOG_HREF}/create`

export const standardHref = (standardId: string): string => `${STANDARDS_CATALOG_HREF}/${encodeURIComponent(standardId)}`

export const isCustomStandard = ({ systemOwned }: { systemOwned?: boolean | null }): boolean => !systemOwned

export const standardDisplayName = ({ shortName, name }: { shortName?: string | null; name?: string | null }): string => shortName || name || ''

export const standardLogoSrc = ({ logoFile }: { logoFile?: { base64?: string | null } | null }): string | null => (logoFile?.base64 ? toBase64DataUri(logoFile.base64) : null)

export const generateShortName = (name: string): string => {
  const trimmed = name.trim()
  return trimmed.split(/\s+/).length > 1 ? orgAbbreviation(trimmed) : trimmed
}

export const isGeneratedFrom = (value: string | undefined, source: string, generate: (source: string) => string): boolean => !value || value === generate(source)
