import { z } from 'zod'
import { TrustCenterSettingTrustCenterThemeMode } from '@repo/codegen/src/schema'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { type Value } from 'platejs'

export const DEFAULT_BRAND_COLOR = '#f0f0e0'

export const brandSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  overview: z.custom<Value | string>().optional(),
  securityContact: z.string().email('Invalid email format').optional().or(z.literal('')),
  statusPageURL: z.string().optional(),
  primaryColor: z.string().optional(),
  foregroundColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  secondaryForegroundColor: z.string().optional(),
  secondaryBackgroundColor: z.string().optional(),
  accentColor: z.string().optional(),
  font: z.string().optional(),
  themeMode: z.nativeEnum(TrustCenterSettingTrustCenterThemeMode).optional(),
  logoRemoteURL: z.string().optional(),
  faviconRemoteURL: z.string().optional(),
  logoFile: z.any().nullable().optional(),
  faviconFile: z.any().nullable().optional(),
  companyName: z.string().optional(),
  companyDescription: z.string().optional(),
  companyDomain: z.string().optional(),
})

export type BrandFormValues = z.infer<typeof brandSchema>

export const useBrandForm = () => {
  return useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      title: '',
      overview: '',
      securityContact: '',
      statusPageURL: '',
      primaryColor: DEFAULT_BRAND_COLOR,
      foregroundColor: DEFAULT_BRAND_COLOR,
      backgroundColor: DEFAULT_BRAND_COLOR,
      secondaryForegroundColor: DEFAULT_BRAND_COLOR,
      secondaryBackgroundColor: DEFAULT_BRAND_COLOR,
      accentColor: DEFAULT_BRAND_COLOR,
      font: 'outfit',
      themeMode: TrustCenterSettingTrustCenterThemeMode.EASY,
      logoRemoteURL: '',
      faviconRemoteURL: '',
      logoFile: null,
      faviconFile: null,
      companyName: '',
      companyDescription: '',
      companyDomain: '',
    },
  })
}
