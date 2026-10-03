import { type UpdateTrustCenterSettingInput } from '@repo/codegen/src/schema'
import { normalizeHexColor } from '@/utils/normalizeHexColor'

type TSettingInputKey = keyof UpdateTrustCenterSettingInput

const COLOR_FIELDS = [
  ['primaryColor', 'clearPrimaryColor'],
  ['foregroundColor', 'clearForegroundColor'],
  ['backgroundColor', 'clearBackgroundColor'],
  ['secondaryForegroundColor', 'clearSecondaryForegroundColor'],
  ['secondaryBackgroundColor', 'clearSecondaryBackgroundColor'],
  ['accentColor', 'clearAccentColor'],
] as const satisfies ReadonlyArray<readonly [TSettingInputKey, TSettingInputKey]>

const CLEARABLE_TEXT_FIELDS = [
  ['securityContact', 'clearSecurityContact'],
  ['statusPageURL', 'clearStatusPageURL'],
  ['companyName', 'clearCompanyName'],
  ['companyDescription', 'clearCompanyDescription'],
  ['companyDomain', 'clearCompanyDomain'],
] as const satisfies ReadonlyArray<readonly [TSettingInputKey, TSettingInputKey]>

type TClearableField = (typeof COLOR_FIELDS)[number][0] | (typeof CLEARABLE_TEXT_FIELDS)[number][0]

export const clearableSettingInput = (source: Partial<Record<TClearableField, string | null>>): UpdateTrustCenterSettingInput => ({
  ...COLOR_FIELDS.reduce<UpdateTrustCenterSettingInput>((input, [field, clearKey]) => {
    const normalized = normalizeHexColor(source[field])
    return { ...input, ...(normalized ? { [field]: normalized } : { [clearKey]: true }) }
  }, {}),
  ...CLEARABLE_TEXT_FIELDS.reduce<UpdateTrustCenterSettingInput>((input, [field, clearKey]) => {
    const value = source[field]
    return { ...input, ...(value ? { [field]: value } : { [clearKey]: true }) }
  }, {}),
})

type TBrandingAsset = {
  fileID: 'logoFileID' | 'faviconFileID'
  remoteURL: 'logoRemoteURL' | 'faviconRemoteURL'
  clearFile: 'clearLogoFile' | 'clearFaviconFile'
  clearRemoteURL: 'clearLogoRemoteURL' | 'clearFaviconRemoteURL'
}

export const LOGO_ASSET = { fileID: 'logoFileID', remoteURL: 'logoRemoteURL', clearFile: 'clearLogoFile', clearRemoteURL: 'clearLogoRemoteURL' } as const satisfies TBrandingAsset

export const FAVICON_ASSET = { fileID: 'faviconFileID', remoteURL: 'faviconRemoteURL', clearFile: 'clearFaviconFile', clearRemoteURL: 'clearFaviconRemoteURL' } as const satisfies TBrandingAsset

export const previewAssetInput = (asset: TBrandingAsset, stagedFile: File | null | undefined, remoteURL: string | null | undefined): UpdateTrustCenterSettingInput => {
  if (stagedFile) return { [asset.clearRemoteURL]: true }
  if (remoteURL) return { [asset.remoteURL]: remoteURL, [asset.clearFile]: true }
  return { [asset.clearRemoteURL]: true }
}

export const publishAssetInput = (
  asset: TBrandingAsset,
  stagedFile: File | null | undefined,
  sourceFileID: string | null | undefined,
  remoteURL: string | null | undefined,
): UpdateTrustCenterSettingInput => {
  if (stagedFile) return { [asset.clearRemoteURL]: true }
  if (sourceFileID) return { [asset.fileID]: sourceFileID, [asset.clearRemoteURL]: true }
  if (remoteURL) return { [asset.remoteURL]: remoteURL, [asset.clearFile]: true }
  return { [asset.clearFile]: true, [asset.clearRemoteURL]: true }
}
