import { TrustCenterSettingTrustCenterThemeMode } from '@repo/codegen/src/schema'
import { parseCssColor } from '@repo/ui/components/editor/plugins/font-contrast.ts'
import { type TrustCenterSetting } from '@/lib/graphql-hooks/trust-center'
import { WHITE_HEX } from '@/utils/color-contrast'

export const resolveTrustCenterBackground = (setting: TrustCenterSetting): string => {
  if (setting?.themeMode === TrustCenterSettingTrustCenterThemeMode.EASY) return WHITE_HEX
  const background = setting?.backgroundColor?.trim()
  return background && parseCssColor(background) ? background : WHITE_HEX
}
