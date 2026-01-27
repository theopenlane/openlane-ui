import { z } from 'zod'
import { TrustCenterSettingTrustCenterThemeMode } from '@repo/codegen/src/schema'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

export const brandSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  overview: z.string().optional(),
  securityContact: z.string().email('Invalid email format').optional().or(z.literal('')),
  primaryColor: z.string().optional(),
  foregroundColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  secondaryForegroundColor: z.string().optional(),
  secondaryBackgroundColor: z.string().optional(),
  accentColor: z.string().optional(),
  font: z.string().optional(),
  themeMode: z.nativeEnum(TrustCenterSettingTrustCenterThemeMode).optional(),
  logoRemoteURL: z.string().optional().or(z.literal('')),
  faviconRemoteURL: z.string().optional().or(z.literal('')),
  logoFile: z.any().nullable().optional(),
  faviconFile: z.any().nullable().optional(),
  companyName: z.string().optional().or(z.literal('')),
  companyDescription: z.string().optional().or(z.literal('')),
})

export type BrandFormValues = z.infer<typeof brandSchema>

export const useBrandForm = () => {
  return useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      title: '',
      overview: '',
      securityContact: '',
      primaryColor: '#f0f0e0',
      foregroundColor: '#f0f0e0',
      backgroundColor: '#f0f0e0',
      secondaryForegroundColor: '#f0f0e0',
      secondaryBackgroundColor: '#f0f0e0',
      accentColor: '#f0f0e0',
      font: 'outfit',
      themeMode: TrustCenterSettingTrustCenterThemeMode.EASY,
      logoRemoteURL: '',
      faviconRemoteURL: '',
      logoFile: null,
      faviconFile: null,
      companyName: '',
      companyDescription: '',
    },
  })
}
