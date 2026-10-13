import { type UseFormReturn } from 'react-hook-form'
import { TrustCenterSettingTrustCenterThemeMode } from '@repo/codegen/src/schema'
import type { ScanBranding } from '@/components/pages/protected/scans/detail/openlane-domain-scan/scan-metadata'
import { type TrustCenterPreviewSetting } from '@/lib/graphql-hooks/trust-center'
import { normalizeHexColor } from '@/utils/normalizeHexColor'
import { toValidHref } from '@/utils/normalizeUrl'
import { TrustCenterWatermarkConfigFontOptions } from '@/components/shared/enum-mapper/trust-center-enum'
import { type BrandFormValues } from '../brand-schema'

type TBrandColorField = 'primaryColor' | 'foregroundColor' | 'backgroundColor' | 'accentColor' | 'secondaryBackgroundColor' | 'secondaryForegroundColor'

const selectableFont = (font: string | undefined): string | null => {
  const wanted = font?.trim().toLowerCase()
  return (wanted && TrustCenterWatermarkConfigFontOptions.find((option) => option.value.toLowerCase() === wanted || option.label.toLowerCase() === wanted)?.value) || null
}

const remoteAssetUrl = (url: string | undefined): string | null => (url && /^https?:\/\//i.test(url.trim()) && toValidHref(url) ? url.trim() : null)

export const applyScanBranding = (
  { setValue, getValues, getFieldState }: Pick<UseFormReturn<BrandFormValues>, 'setValue' | 'getValues' | 'getFieldState'>,
  branding: ScanBranding,
  previewSetting: TrustCenterPreviewSetting,
): number => {
  const colors: Array<[TBrandColorField, string | null]> = [
    ['primaryColor', normalizeHexColor(branding.primary_color)],
    ['foregroundColor', normalizeHexColor(branding.foreground_color)],
    ['backgroundColor', normalizeHexColor(branding.background_color)],
    ['accentColor', normalizeHexColor(branding.accent_color)],
    ['secondaryBackgroundColor', normalizeHexColor(branding.secondary_background_color)],
    ['secondaryForegroundColor', normalizeHexColor(branding.secondary_foreground_color)],
  ]
  const hasPendingColor = (field: TBrandColorField) => !!normalizeHexColor(getValues(field)) && (getFieldState(field).isDirty || !!normalizeHexColor(previewSetting?.[field]))
  const hasCompletePalette = colors.every(([field, color]) => !!color || hasPendingColor(field))
  const font = selectableFont(branding.font)
  const logoUrl = previewSetting?.logoFile?.id || getValues('logoFile') ? null : remoteAssetUrl(branding.logo_url)
  const faviconUrl = previewSetting?.faviconFile?.id || getValues('faviconFile') ? null : remoteAssetUrl(branding.favicon?.url)

  let applied = 0
  colors.forEach(([field, color]) => {
    if (!color) return
    setValue(field, color, { shouldDirty: true })
    applied++
  })

  if (applied > 0 && hasCompletePalette) {
    setValue('themeMode', TrustCenterSettingTrustCenterThemeMode.ADVANCED, { shouldDirty: true })
  }

  if (font) {
    setValue('font', font, { shouldDirty: true })
    applied++
  }

  if (logoUrl) {
    setValue('logoRemoteURL', logoUrl, { shouldDirty: true })
    applied++
  }

  if (faviconUrl) {
    setValue('faviconRemoteURL', faviconUrl, { shouldDirty: true })
    applied++
  }

  return applied
}
