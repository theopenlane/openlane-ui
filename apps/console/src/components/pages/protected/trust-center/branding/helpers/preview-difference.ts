import { type TrustCenterPreviewSetting, type TrustCenterSetting } from '@/lib/graphql-hooks/trust-center'
import { normalizeHexColor } from '@/utils/normalizeHexColor'

type BrandingSetting = NonNullable<TrustCenterSetting> | NonNullable<TrustCenterPreviewSetting>

export type BrandingPreviewDifference = {
  companyInfo: boolean
  text: boolean
  theme: boolean
  assets: boolean
  any: boolean
  comparable: boolean
}

const NOT_COMPARABLE: BrandingPreviewDifference = { companyInfo: false, text: false, theme: false, assets: false, any: false, comparable: false }

const asText = (value?: string | null) => value || null
const asColor = (value?: string | null) => normalizeHexColor(value)

const toSections = (source: BrandingSetting) => ({
  companyInfo: [asText(source.companyName), asText(source.companyDescription), asText(source.companyDomain), asText(source.statusPageURL), asText(source.securityContact)],
  text: [asText(source.title), asText(source.overview)],
  theme: [
    asText(source.themeMode),
    asText(source.font),
    asColor(source.primaryColor),
    asColor(source.foregroundColor),
    asColor(source.backgroundColor),
    asColor(source.accentColor),
    asColor(source.secondaryForegroundColor),
    asColor(source.secondaryBackgroundColor),
  ],
  assets: [asText(source.logoFile?.id), asText(source.logoRemoteURL), asText(source.faviconFile?.id), asText(source.faviconRemoteURL)],
})

const differs = (a: (string | null)[], b: (string | null)[]) => a.some((value, index) => value !== b[index])

export const getBrandingPreviewDifference = (setting: TrustCenterSetting, previewSetting: TrustCenterPreviewSetting): BrandingPreviewDifference => {
  if (!setting || !previewSetting) return NOT_COMPARABLE

  const published = toSections(setting)
  const preview = toSections(previewSetting)

  const companyInfo = differs(published.companyInfo, preview.companyInfo)
  const text = differs(published.text, preview.text)
  const theme = differs(published.theme, preview.theme)
  const assets = differs(published.assets, preview.assets)

  return { companyInfo, text, theme, assets, any: companyInfo || text || theme || assets, comparable: true }
}
