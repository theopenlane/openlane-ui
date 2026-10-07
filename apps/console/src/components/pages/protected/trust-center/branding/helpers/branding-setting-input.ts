import { type UpdateTrustCenterSettingInput } from '@repo/codegen/src/schema'
import { normalizeHexColor } from '@/utils/normalizeHexColor'
import { isEmptyInputValue, orClear, richTextOrClear, type TFieldMappers } from '@/hooks/useDirtyInput'
import { type BrandFormValues } from '../brand-schema'

const CLEARABLE_SETTING_FIELDS = [
  'primaryColor',
  'foregroundColor',
  'backgroundColor',
  'secondaryForegroundColor',
  'secondaryBackgroundColor',
  'accentColor',
  'securityContact',
  'statusPageURL',
  'companyName',
  'companyDescription',
  'companyDomain',
] as const

type TClearableSettingField = (typeof CLEARABLE_SETTING_FIELDS)[number]

type TClearableSettingSource = Partial<Record<TClearableSettingField, string | null>>

const valueOrClear = (value: string | null | undefined, set: (value: string) => UpdateTrustCenterSettingInput, clear: UpdateTrustCenterSettingInput): UpdateTrustCenterSettingInput =>
  value === null || value === undefined || isEmptyInputValue(value) ? clear : set(value)

const CLEARABLE_SETTING_INPUTS = {
  primaryColor: (value) => valueOrClear(normalizeHexColor(value), (primaryColor) => ({ primaryColor }), { clearPrimaryColor: true }),
  foregroundColor: (value) => valueOrClear(normalizeHexColor(value), (foregroundColor) => ({ foregroundColor }), { clearForegroundColor: true }),
  backgroundColor: (value) => valueOrClear(normalizeHexColor(value), (backgroundColor) => ({ backgroundColor }), { clearBackgroundColor: true }),
  secondaryForegroundColor: (value) => valueOrClear(normalizeHexColor(value), (secondaryForegroundColor) => ({ secondaryForegroundColor }), { clearSecondaryForegroundColor: true }),
  secondaryBackgroundColor: (value) => valueOrClear(normalizeHexColor(value), (secondaryBackgroundColor) => ({ secondaryBackgroundColor }), { clearSecondaryBackgroundColor: true }),
  accentColor: (value) => valueOrClear(normalizeHexColor(value), (accentColor) => ({ accentColor }), { clearAccentColor: true }),
  securityContact: (value) => valueOrClear(value, (securityContact) => ({ securityContact }), { clearSecurityContact: true }),
  statusPageURL: (value) => valueOrClear(value, (statusPageURL) => ({ statusPageURL }), { clearStatusPageURL: true }),
  companyName: (value) => valueOrClear(value, (companyName) => ({ companyName }), { clearCompanyName: true }),
  companyDescription: (value) => valueOrClear(value, (companyDescription) => ({ companyDescription }), { clearCompanyDescription: true }),
  companyDomain: (value) => valueOrClear(value, (companyDomain) => ({ companyDomain }), { clearCompanyDomain: true }),
} satisfies Record<TClearableSettingField, (value: string | null | undefined) => UpdateTrustCenterSettingInput>

export const clearableSettingInput = (source: TClearableSettingSource): UpdateTrustCenterSettingInput =>
  CLEARABLE_SETTING_FIELDS.reduce<UpdateTrustCenterSettingInput>((input, field) => ({ ...input, ...CLEARABLE_SETTING_INPUTS[field](source[field]) }), {})

type TSettingKey<K extends keyof UpdateTrustCenterSettingInput> = K

type TBrandingAsset = {
  fileID: TSettingKey<'logoFileID' | 'faviconFileID'>
  remoteURL: TSettingKey<'logoRemoteURL' | 'faviconRemoteURL'>
  clearFile: TSettingKey<'clearLogoFile' | 'clearFaviconFile'>
  clearRemoteURL: TSettingKey<'clearLogoRemoteURL' | 'clearFaviconRemoteURL'>
}

export const LOGO_ASSET = { fileID: 'logoFileID', remoteURL: 'logoRemoteURL', clearFile: 'clearLogoFile', clearRemoteURL: 'clearLogoRemoteURL' } as const satisfies TBrandingAsset

export const FAVICON_ASSET = { fileID: 'faviconFileID', remoteURL: 'faviconRemoteURL', clearFile: 'clearFaviconFile', clearRemoteURL: 'clearFaviconRemoteURL' } as const satisfies TBrandingAsset

const previewAssetInput = (asset: TBrandingAsset, stagedFile: File | null | undefined, remoteURL: string | null | undefined): UpdateTrustCenterSettingInput =>
  remoteURL && !stagedFile ? { [asset.remoteURL]: remoteURL, [asset.clearFile]: true } : { [asset.clearRemoteURL]: true }

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

const previewAssetFieldInput =
  (asset: TBrandingAsset, file: 'logoFile' | 'faviconFile', remoteURL: 'logoRemoteURL' | 'faviconRemoteURL') =>
  (_value: File | string | null | undefined, values: BrandFormValues): UpdateTrustCenterSettingInput =>
    previewAssetInput(asset, values[file], values[remoteURL])

export const BRANDING_PREVIEW_FIELDS = {
  ...CLEARABLE_SETTING_INPUTS,
  title: orClear('clearTitle'),
  overview: richTextOrClear('clearOverview'),
  font: orClear('clearFont'),
  themeMode: orClear('clearThemeMode'),
  logoFile: previewAssetFieldInput(LOGO_ASSET, 'logoFile', 'logoRemoteURL'),
  logoRemoteURL: previewAssetFieldInput(LOGO_ASSET, 'logoFile', 'logoRemoteURL'),
  faviconFile: previewAssetFieldInput(FAVICON_ASSET, 'faviconFile', 'faviconRemoteURL'),
  faviconRemoteURL: previewAssetFieldInput(FAVICON_ASSET, 'faviconFile', 'faviconRemoteURL'),
} satisfies TFieldMappers<BrandFormValues, UpdateTrustCenterSettingInput>
